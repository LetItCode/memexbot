const debug = require('debug')('memex:app')
require('dotenv').config()

// Inversion of Control by Dependency Injection Container pattern
const ioc = require('./lib/diContainer')()

ioc.register('cache', require('./level'))

ioc.register('cwApiToken', process.env.CWAPI_TOKEN)
ioc.factory('cw', require('./cw'))

ioc.register('botToken', process.env.BOT_TOKEN)
ioc.factory('bot', require('./bot'))

ioc.get('bot')
