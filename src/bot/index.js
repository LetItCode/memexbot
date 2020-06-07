const debug = require('debug')('memex:app')
const { Telegraf, session } = require('telegraf')
const TelegrafI18n = require('telegraf-i18n')
const TelegrafWidget = require('telegraf-widget')
const path = require('path')
const sessionStore = require('./store')
const helpers = require('./helpers')
const widgets = require('./widgets')
const { greet, settings } = require('./handlers')

const { match } = TelegrafI18n
const i18n = new TelegrafI18n({
  defaultLanguage: 'ru',
  directory: path.resolve(__dirname, 'locales')
})

module.exports = async (botToken, cache, cw) => {
  class CustomContext extends Telegraf.Context {
    async replyWithPhoto (opts, ...extra) {
      let fileId = ''
      const file = opts && opts.source
      if (file) {
        fileId = await this.cache.images.get(opts.source).catch(debug)
      }
      if (fileId) {
        return super.replyWithPhoto(fileId, ...extra)
      }
      const res = await super.replyWithPhoto(opts, ...extra)
      this.cache.images.put(file, res.photo[res.photo.length - 1].file_id)
      return Promise.resolve(res)
    }
  }

  const bot = new Telegraf(botToken, { contextType: CustomContext })

  bot.context.cache = {
    images: cache('image')
  }
  bot.context.h = helpers
  bot.context.cw = cw

  const sessionConfig = { store: sessionStore(cache) }

  bot.use(session(sessionConfig), i18n, new TelegrafWidget(widgets))

  bot.hears(['/settings', match('buttons.settings')], settings)
  bot.command('start', greet)

  bot.catch(debug)
  bot.launch()

  return bot
}
