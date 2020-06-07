const { Markup } = require('telegraf')

module.exports = async ctx => {
  const { from, replyWithHTML, i18n, db, h } = ctx

  const text = i18n.t('greeting')

  const extra = Markup.keyboard([Markup.button(i18n.t('buttons.settings')), Markup.button(i18n.t('buttons.folio'))], {
    columns: 2
  })
    .resize()
    .extra()

  return replyWithHTML(text, extra)
}
