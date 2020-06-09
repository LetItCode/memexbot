const { Markup, Extra, safePassThru } = require('telegraf')
const { Widget } = require('telegraf-widget')

const Pages = {
  NEWS: 'news',
  GUIDES: 'guides',
  CONTACTS: 'contacts'
}

const folioWidget = new Widget('folio', 'news')

folioWidget.on(Pages.NEWS, async ctx => {
  const { reply, editMessageText, answerCbQuery, widget, i18n, db } = ctx

  const page = widget.query && widget.query.page

  const news = await db.News.find()
  if (!news.length) return safePassThru()

  let text = i18n.t('folio.news.title') + '\n\n'
  text += news.map(({ emoji, url, title }) => i18n.t('folio.news.row', { emoji, url, title }))

  const extra = generateKeyboard(i18n, page).HTML().webPreview(false)

  return widget.data ? editMessageText(text, extra).catch(() => answerCbQuery()) : reply(text, extra)
})

folioWidget.on(Pages.GUIDES, ctx => {
  const { reply, editMessageText, answerCbQuery, widget, i18n } = ctx

  const page = widget.query && widget.query.page
  const text = i18n.t('folio.guides')
  const extra = generateKeyboard(i18n, page).HTML()

  return widget.data ? editMessageText(text, extra).catch(() => answerCbQuery()) : reply(text, extra)
})

folioWidget.on(Pages.CONTACTS, ctx => {
  const { reply, editMessageText, answerCbQuery, widget, i18n } = ctx

  const page = widget.query && widget.query.page
  const text = i18n.t('folio.contacts')
  const extra = generateKeyboard(i18n, page).HTML()

  return widget.data ? editMessageText(text, extra).catch(() => answerCbQuery()) : reply(text, extra)
})

module.exports = folioWidget

function generateKeyboard (i18n, currentPage = Pages.NEWS) {
  const buttons = [
    generateButton(i18n.t('buttons.news'), Pages.NEWS, currentPage),
    generateButton(i18n.t('buttons.guides'), Pages.GUIDES, currentPage),
    generateButton(i18n.t('buttons.contacts'), Pages.CONTACTS, currentPage)
  ]
  const columns = buttons.length
  if (currentPage === Pages.CONTACTS) {
    buttons.push(Markup.switchToCurrentChatButton(i18n.t('buttons.search'), 'find:'))
  }
  return Extra.markup(m => m.inlineKeyboard(buttons, { columns }))
}

function generateButton (title, page, currentPage) {
  const title_ = page === currentPage ? `• ${title} •` : title
  return folioWidget.button(title_, page, { page })
}
