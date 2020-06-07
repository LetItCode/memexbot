const { Extra, safePassThru } = require('telegraf')
const { Widget } = require('telegraf-widget')

const Pages = {
  AUTH: 'auth',
  LANGUAGE: 'language'
}

const settingsWidget = new Widget('settings', 'auth')

settingsWidget.on(Pages.AUTH, async ctx => {
  const { from, reply, editMessageText, answerCbQuery, widget, i18n, db, cw } = ctx

  const Grants = { ...cw.Operations, AUTH: 'auth' }

  const page = widget.query && widget.query.page

  const user = await db.User.findOne({ telegramId: from.id })
  if (!user) return safePassThru()
  const { grants } = user

  console.log(grants.includes(Grants.PROFILE))
  let text = i18n.t('settings.auth.title') + '\n\n'
  text += i18n.t('settings.auth.text') + '\n\n'
  if (grants.includes(Grants.AUTH)) {
    text += i18n.t(`settings.auth.profile.${grants.includes(Grants.PROFILE) ? 'off' : 'on'}`) + '\n'
    text += i18n.t(`settings.auth.stock.${grants.includes(Grants.STOCK) ? 'off' : 'on'}`)
  } else {
    text += i18n.t('settings.auth.auth')
  }

  const extra = generateKeyboard(i18n, page).HTML()

  return widget.data ? editMessageText(text, extra).catch(() => answerCbQuery()) : reply(text, extra)
})

settingsWidget.on(Pages.LANGUAGE, ctx => {
  const { reply, editMessageText, answerCbQuery, widget, i18n } = ctx

  const page = widget.query && widget.query.page
  const text = 'lang'
  const extra = generateKeyboard(i18n, page)

  return widget.data ? editMessageText(text, extra).catch(() => answerCbQuery()) : reply(text, extra)
})

module.exports = settingsWidget

function generateKeyboard (i18n, currentPage = Pages.AUTH) {
  const buttons = [
    generateButton(i18n.t('buttons.auth'), Pages.AUTH, currentPage),
    generateButton(i18n.t('buttons.language'), Pages.LANGUAGE, currentPage)
  ]
  return Extra.markup(m => m.inlineKeyboard(buttons))
}

function generateButton (title, page, currentPage) {
  const title_ = page === currentPage ? `• ${title} •` : title
  return settingsWidget.button(title_, page, { page })
}
