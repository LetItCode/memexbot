const cron = require('node-schedule')
const moment = require('moment')
const base58 = require('base58-random')

module.exports = (telegram, opts) => {
  const options = {
    store: new Map(),
    getEventKey: ({ chatId, tag }) => chatId && tag && `${chatId}:${tag}`,
    generateTag: () => base58(6),
    dateFormat: 'DD.MM.YYYY hh:mm:ss Z',
    utcOffset: '+03:00',
    ...opts
  }
  const jobs = new Map() // Для управления заданиями вне зависимости от типа хранилища
  const scheduler = {}

  scheduler.load = () => options.store.forEach(event => scheduler.addEvent(event.date, event))

  scheduler.addEvent = (date, data) => {
    data.tag = data.tag || options.generateTag()
    data.utcOffset = data.utcOffset || options.utcOffset
    const timestamp = moment(`${date} ${data.utcOffset}`, options.dateFormat).valueOf()
    const key = scheduler.getEventKey(data)
    const job = cron.scheduleJob(timestamp, () => scheduler.remind(data))
    if (job) {
      jobs.set(key, job)
      if (!options.store.has(key)) {
        options.store.set(key, { date, ...data })
      }
    } else {
      scheduler.remind(data)
    }
    return data.tag
  }

  scheduler.removeEvent = key => {
    let ok = false
    if (jobs.has(key)) {
      jobs.get(key).cancel()
      jobs.delete(key)
      ok = true
    }
    if (options.store.has(key)) {
      options.store.delete(key)
      ok = true
    }
    return { ok }
  }

  scheduler.remind = data => {
    scheduler.removeEvent(options.getEventKey(data))
    telegram.sendMessage(data.chatId, data.message)
  }

  scheduler.list = () => {
    // Чтобы не переписывать при кастомном хранилище еще и метод map
    const events = []
    options.store.forEach(event => events.push(event))
    return events
  }

  scheduler.getEventKey = options.getEventKey

  return scheduler
}
