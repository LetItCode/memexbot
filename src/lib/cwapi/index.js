const debug = require('debug')('memex:lib:cwapi')
const { v4: uuidv4 } = require('uuid')

const messageCache = require('./messageCache')
const constants = require('./constants')
const { Servers, Topics, Actions, Results } = constants

const CwApi = class {
  constructor (token, options) {
    this.token = token
    this.options = {
      server: Servers.CW3,
      io: true,
      topics: Object.values(Topics), // all Topics by default
      kafkaGroup: token.split(':')[0],
      timeOut: 30000,
      reconnectDelay: 5000,
      ...options
    }
    this.nextMessageId = 0
    this.cache = messageCache()
  }

  async connect () {
    // AMQP
    if (this.options.io) {
      const amqpManager = require('amqp-connection-manager')

      this.application = this.token.split(':')[0]
      this.amqpUrl = `amqps://${this.token}@${this.options.server.amqp}`
      this.exchange = `${this.application}_ex`
      this.routingKey = `${this.application}_o`
      this.inboundQueue = `${this.application}_i`
      this.handlers = new Map()

      const connection = amqpManager.connect(this.amqpUrl)
      this.amqp = connection.createChannel({
        json: true,
        setup: channel =>
          channel.consume(this.inboundQueue, message => this.handleMessage('reacts', message.content), { noAck: true })
      })
    }

    // Kafka
    const availableTopics = Object.values(Topics)
    this.topics = this.options.topics
      .filter(topic => availableTopics.includes(topic) || debug('Unknown topic:', topic))
      .map(topic => this.options.server.topicPrefix + topic)

    if (this.topics.length) {
      const { ConsumerGroup } = require('kafka-node')

      this.groupId = this.options.kafkaGroup

      const kafka = new ConsumerGroup(
        {
          kafkaHost: this.options.server.kafka,
          groupId: this.groupId,
          fromOffset: 'earliest',
          commitOffsetsOnFirstJoin: true,
          autoCommit: true
        },
        this.topics
      )

      kafka.on('error', err => {
        debug(err)
        kafka.reconnectIfNeeded()
      })

      kafka.on('message', message => {
        const route = message.topic.replace(/^\w+-/, '')
        this.handleMessage(route, message.value)
      })
    }
  }

  handleMessage (route, message) {
    const payload = JSON.parse(message)
    if (route === 'reacts') {
      this.responseReact(payload)
    } else {
      const middleware = this.handlers.get(route) || []
      this.executeMiddleware(middleware, payload)
    }
  }

  responseReact (message) {
    const { action, result, payload } = message
    const { userId, operation, requestId, transactionId, debit, fee = 0 } = payload || {}
    let cache

    debug('Response react:', message)

    switch (action) {
      case Actions.AUTH:
      case Actions.GRANT:
        cache = this.cache.find({
          'message.action': action,
          'message.payload.userId': userId
        })
        break
      case Actions.AUTH_ADDITIONAL:
        cache = this.cache.find({
          'message.action': action,
          'message.payload.operation': operation,
          'opts.userId': userId
        })
        break
      case Actions.AUTH_PAYMENT:
      case Actions.PAY:
      case Actions.PAYOUT: {
        const query = {
          'message.action': action,
          'message.payload.transactionId': transactionId
        }
        if (result === Results.OK) {
          query['message.payload.amount.pouches'] = Math.round((debit.gold + fee.gold) / 100)
          query['opts.userId'] = userId
        }
        cache = this.cache.find(query)
        break
      }
      case Actions.GRANT_ADDITIONAL:
        cache = this.cache.find({ 'message.payload.requestId': requestId })
        break
      case Actions.BASIC:
      case Actions.PROFILE:
      case Actions.STOCK:
      case Actions.GEAR:
      case Actions.CRAFTBOOK:
      case Actions.GUILD:
      case Actions.WTB:
        cache = this.cache.find({
          'message.action': action,
          'opts.userId': userId
        })
        break
      case Actions.APP:
        cache = this.cache.find({ 'message.action': action })
        break
    }

    if (cache) this.cache.remove({ id: cache.id })
    check(cache.resolve, cache.reject)

    function check (resolve, reject) {
      return result === Results.OK ? resolve(message) : reject(new Error(result))
    }
  }

  executeMiddleware (middleware, arg, finish) {
    iterator.call(this, 0)
    function iterator (index) {
      if (index === middleware.length) return finish && finish()
      middleware[index].call(this, arg, err => {
        if (err) return debug('Middleware error:', err.message)
        iterator.call(this, ++index)
      })
    }
  }

  on (topic, middleware) {
    const handlers = this.handlers.get(topic)
    if (handlers) {
      handlers.push(middleware)
    } else {
      this.handlers.set(topic, [middleware])
    }
  }

  publish (data) {
    return this.amqp.publish(this.exchange, this.routingKey, data)
  }

  sendMessage (data, opts) {
    const id = this.newId()

    debug(`Sending message #${id}:`, data)

    return Promise.race([
      new Promise((resolve, reject) => {
        this.cache.add(id, data, { opts, resolve, reject })
        return this.publish(data)
      }),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('Request timeout')), this.options.timeOut))
    ])
  }

  // CW API Protocol

  /**
   * Access request from your application to the user
   * @param {number} userId - subjects Telegram userId
   */
  createAuthCode (userId) {
    const data = {
      action: Actions.AUTH,
      payload: {
        userId
      }
    }
    return this.sendMessage(data)
  }

  /**
   * Exchange auth code for access token
   * @param {number} userId - subjects Telegram userId
   * @param {string} authCode - authorization code, entered by user
   */
  grantToken (userId, authCode) {
    const data = {
      action: Actions.GRANT,
      payload: {
        userId,
        authCode
      }
    }
    return this.sendMessage(data)
  }

  /**
   * Sends request to broaden tokens operations set to user
   * @param {string} token - target user access token
   * @param {string} operation - requested operation
   * @param {number} userId - subjects Telegram userId
   */
  authAdditionalOperation (token, operation, userId) {
    const data = {
      token,
      action: Actions.AUTH_ADDITIONAL,
      payload: {
        operation
      }
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Completes the authAdditionalOperation action
   * @param {string} token - target user access token
   * @param {string} requestId - requestId of parent authAdditionalOperation
   * @param {string} authCode - code supplied by user for this requestId
   */
  grantAdditionalOperation (token, requestId, authCode) {
    const data = {
      token,
      action: Actions.GRANT_ADDITIONAL,
      payload: {
        requestId,
        authCode
      }
    }
    return this.sendMessage(data)
  }

  /**
   * Sends authorization request to user with confirmation code in it
   * @param {string} token - target user access token
   * @param {number} amount - hold amount
   * @param {number} userId - subjects Telegram userId
   * @param {string=} transactionId - applications internal transaction id, must be unique. Generates UUID v4 by default
   */
  authorizePayment (token, amount, userId, transactionId = uuidv4()) {
    const data = {
      token,
      action: Actions.AUTH_PAYMENT,
      payload: {
        amount: {
          pouches: amount // hold amount
        },
        transactionId // applications internal transaction id, must be unique
      }
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Transfers held an amount of gold from users account to application’s balance
   * @param {string} token - target user access token
   * @param {number} amount - hold amount
   * @param {string} authCode - confirmation code, from previous authorizePayment request
   * @param {number} userId - subjects Telegram userId
   * @param {string} transactionId - applications internal transaction id, must be unique
   */
  pay (token, amount, confirmationCode, userId, transactionId) {
    const data = {
      token,
      action: Actions.PAY,
      payload: {
        amount: {
          pouches: amount
        },
        confirmationCode,
        transactionId
      }
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Transfers of a given amount of gold (or pouches) from the application’s balance to users account
   * @param {string} token - target user access token
   * @param {number} amount - amount of gold pouches application wishes to transfer to user
   * @param {string} message - arbitrary message, limit - 100 symbols
   * @param {number} userId - subjects Telegram userId
   * @param {string} transactionId - applications internal transaction id, must be unique
   */
  payout (token, amount, message, userId, transactionId) {
    const data = {
      token,
      action: Actions.PAYOUT,
      payload: {
        transactionId,
        amount: {
          pouches: amount
        },
        message
      }
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Request basic user stats
   * @param {string} token - target user access token
   * @param {number} userId - subjects Telegram userId
   */
  requestBasicInfo (token, userId) {
    const data = {
      token,
      action: Actions.BASIC
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Request brief user profile information
   * @param {string} token - target user access token
   * @param {number} userId - subjects Telegram userId
   */
  requestProfile (token, userId) {
    const data = {
      token,
      action: Actions.PROFILE
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Request users stock information
   * @param {string} token - target user access token
   * @param {number} userId - subjects Telegram userId
   */
  requestStock (token, userId) {
    const data = {
      token,
      action: Actions.STOCK
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Request user's current outfit
   * @param {string} token - target user access token
   * @param {number} userId - subjects Telegram userId
   */
  requestGearInfo (token, userId) {
    const data = {
      token,
      action: Actions.GEAR
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Request the list of recipes known to user
   * @param {string} token - target user access token
   * @param {number} userId - subjects Telegram userId
   */
  viewCraftbook (token, userId) {
    const data = {
      token,
      action: Actions.CRAFTBOOK
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Request users guild information. Common info and stock. Excluding roster
   * @param {string} token - target user access token
   * @param {number} userId - subjects Telegram userId
   */
  guildInfo (token, userId) {
    const data = {
      token,
      action: Actions.GUILD
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Issues an wtb order on behalf of user
   * @param {string} token - target user access token
   * @param {string} itemCode - the code of an item
   * @param {number} quantity - quantity of items
   * @param {number} price - desired price
   * @param {boolean} exactPrice - try to buy exactly for given price, fail otherwise
   * @param {number} userId - subjects Telegram userId
   */
  wantToBuy (token, itemCode, quantity, price, exactPrice, userId) {
    const data = {
      token,
      action: Actions.WTB,
      payload: {
        itemCode,
        quantity,
        price,
        exactPrice
      }
    }
    return this.sendMessage(data, { userId })
  }

  /**
   * Request current info about your application. E.g. balance, limits, status
   */
  getInfo () {
    const data = {
      action: Actions.APP
    }
    return this.sendMessage(data)
  }

  // Sugar
  auction (middleware) {
    this.on(Topics.AU, middleware)
  }

  deal (middleware) {
    this.on(Topics.DEALS, middleware)
  }

  duel (middleware) {
    this.on(Topics.DUELS, middleware)
  }

  offer (middleware) {
    this.on(Topics.OFFERS, middleware)
  }

  sex (middleware) {
    this.on(Topics.SEX, middleware)
  }

  yp (middleware) {
    this.on(Topics.YP, middleware)
  }

  // Misc
  newId () {
    this.nextMessageId += 1
    return this.nextMessageId.toString()
  }
}

module.exports = Object.assign(CwApi, { CwApi, constants })
