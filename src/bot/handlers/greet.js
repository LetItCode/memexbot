const { Markup } = require('telegraf')

module.exports = async ctx => {
  const { from, replyWithHTML, i18n, db, h } = ctx

  const user = await db.User.findOneAndUpdate(
    { telegramId: from.id },
    { username: from.username, firstName: from.first_name, lastName: from.last_name },
    { upsert: true, new: true }
  )

  const name = h.fullName(user)

  const text = i18n.t('greeting', { name })

  const extra = Markup.keyboard([Markup.button(i18n.t('buttons.settings')), Markup.button(i18n.t('buttons.folio'))], {
    columns: 2
  })
    .resize()
    .extra()

  return replyWithHTML(text, extra)
}
