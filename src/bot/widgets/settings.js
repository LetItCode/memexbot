const { Markup } = require('telegraf')
const { Widget } = require('telegraf-widget')

const Pages = {
  AUTH: 'auth',
  LANGUAGE: 'language'
}

const settingsWidget = new Widget('settings', 'auth')

settingsWidget.on(Pages.AUTH, ctx => {
  const { reply, editMessageText, answerCbQuery, widget, i18n } = ctx

  const page = widget.query && widget.query.page
  const text = 'auth'
  const extra = generateKeyboard(i18n, page)

  answerCbQuery()
  return widget.data ? editMessageText(text, extra) : reply(text, extra)
})

settingsWidget.on(Pages.LANGUAGE, ctx => {
  const { reply, editMessageText, answerCbQuery, widget, i18n } = ctx

  const page = widget.query && widget.query.page
  const text = 'lang'
  const extra = generateKeyboard(i18n, page)

  answerCbQuery()
  return widget.data ? editMessageText(text, extra) : reply(text, extra)
})

module.exports = settingsWidget

function generateKeyboard (i18n, currentPage = Pages.AUTH) {
  const buttons = [
    generateButton(i18n.t('buttons.auth'), Pages.AUTH, currentPage),
    generateButton(i18n.t('buttons.language'), Pages.LANGUAGE, currentPage)
  ]
  return Markup.inlineKeyboard(buttons).extra()
}

function generateButton (title, page, currentPage) {
  const title_ = page === currentPage ? `• ${title} •` : title
  return settingsWidget.button(title_, page, { page })
}
