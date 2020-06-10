module.exports = async ctx => {
  const { chat, replyWithHTML, i18n, db } = ctx

  // Pivot view
  const pivot = await db.Trigger.aggregate([
    { $match: { chatId: chat.id } },
    { $group: { _id: '$type', triggers: { $push: '$trigger' } } }
  ])
  if (!pivot) {
    const text = i18n.t('triggers.empty')
    return replyWithHTML(text)
  }

  let text = i18n.t('triggers.title') + '\n\n'
  text += pivot
    .map(({ _id: type, triggers }) => i18n.t(`triggers.types.${type}`) + '\n<pre>' + triggers.join(', ') + '</pre>')
    .join('\n\n')
  return replyWithHTML(text)
}
