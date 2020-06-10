const { safePassThru } = require('telegraf')

const Triggers = {
  TEXT: 'text',
  STICKER: 'sticker',
  PHOTO: 'photo',
  ANIMATION: 'animation'
}

module.exports = async ctx => {
  const { match, message, chat, replyWithHTML, i18n, db, h } = ctx
  const { cmd, trigger } = match.groups

  const targetMessage = message.reply_to_message

  if (cmd === 'trigger') {
    if (!message.reply_to_message) return safePassThru()

    let answer
    if (targetMessage.text) {
      const text = targetMessage.entities
        ? h.formatHTML(targetMessage.text, targetMessage.entities)
        : targetMessage.text
      answer = { type: Triggers.TEXT, text }
    } else if (targetMessage.sticker) {
      answer = { type: Triggers.STICKER, text: targetMessage.sticker.file_id }
    } else if (targetMessage.photo) {
      answer = { type: Triggers.PHOTO, text: h.last(targetMessage.photo).file_id }
    } else if (targetMessage.animation) {
      answer = { type: Triggers.ANIMATION, text: targetMessage.animation.file_id }
    }

    const res = await db.Trigger.updateOne(
      { chatId: chat.id, trigger: trigger.toLowerCase() }, // prettier-ignore
      answer,
      { upsert: true }
    )

    const text = i18n.t('triggers.add')
    if (res.ok) return replyWithHTML(text)
  }

  if (cmd === 'trigger_remove') {
    const res = await db.Trigger.deleteOne({ chatId: chat.id, trigger })

    const text = i18n.t('triggers.remove')
    if (res.ok) return replyWithHTML(text)
  }
}
