const debug = require('debug')('memex:bot')
const { Telegraf, Composer, session } = require('telegraf')
const TelegrafI18n = require('telegraf-i18n')
const TelegrafWidget = require('telegraf-widget')
const path = require('path')
const sessionStore = require('./store')
const helpers = require('./helpers')
const widgets = require('./widgets')
const { cwForward } = require('./middleware')
const { greet, settings, auth, grant, folio, search, trigger, triggers, spy } = require('./handlers')

const { match } = TelegrafI18n
const i18n = new TelegrafI18n({
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true,
  directory: path.resolve(__dirname, 'locales')
})

module.exports = async (botToken, cache, database, cw) => {
  class CustomContext extends Telegraf.Context {
    async replyWithPhoto (opts, ...extra) {
      let fileId = opts
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
  bot.context.db = database
  bot.context.cw = cw
  bot.context.c = {
    Grants: { ...cw.Operations, AUTH: 'Auth' }
  }

  const sessionConfig = { store: sessionStore(cache) }

  bot.use(session(sessionConfig), i18n, new TelegrafWidget(widgets))

  bot.on('inline_query', search)

  const privateMode = new Composer()
  privateMode.command('start', greet)
  privateMode.hears(['/settings', match('buttons.settings')], settings)
  privateMode.hears(/^\/(?<cmd>auth(_revoke|_restart)?)(_(?<param>profile|stock|gear))?$/, auth)
  privateMode.hears(/^Code (?<code>\d{6}) to authorize.+:\n?(?<grants>.+)?/s, cwForward(grant))
  privateMode.hears(['/folio', match('buttons.folio')], folio)

  const groupMode = new Composer()
  groupMode.hears(/^\/(?<cmd>trigger(_remove)?) (?<trigger>.+)/, trigger)
  groupMode.command('triggers', triggers)
  groupMode.on('text', spy)

  bot.use(Composer.privateChat(privateMode), Composer.groupChat(groupMode))

  bot.catch(debug)
  bot.launch()

  return bot
}
