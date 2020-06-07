require('dotenv').config()
const path = require('path')
const { Telegraf } = require('telegraf')
const I18n = require('telegraf-i18n')

const Scheduler = require('./lib/scheduler')
const { greet, help, remind, forget, list } = require('./handlers')

const i18n = new I18n({
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true,
  directory: path.resolve(__dirname, 'locales')
})

const bot = new Telegraf(process.env.BOT_TOKEN)

const scheduler = Scheduler(bot.telegram)
scheduler.load()

bot.context.scheduler = scheduler

bot.catch(err => console.trace(err))
bot.use(i18n)
bot.start(greet)
bot.help(help)
bot.hears(
  /^(?<date>\d{2}[.-/]\d{2}[.-/]\d{4})\s+(?:(?<time>\d{1,2}[:.-]\d{1,2}(?:[:.-]\d{1,2})?)\s+)(?<message>[^]+)/,
  remind
)
bot.hears(/\/rm_(?<tag>\w{6})/, forget)
bot.hears(['/list', I18n.match('buttons.list')], list)

bot.launch()
