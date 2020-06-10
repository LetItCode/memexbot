const { Extra, safePassThru } = require('telegraf')

const Triggers = {
  TEXT: 'text',
  STICKER: 'sticker'
}

module.exports = async ctx => {
  const { chat, message, replyWithHTML, db } = ctx

  const trigger = await db.Trigger.findOne({ chatId: chat.id, trigger: message.text })
  if (!trigger) return safePassThru()

  if (trigger.type === Triggers.TEXT) {
    return replyWithHTML(trigger.text, Extra.inReplyTo(message.message_id))
  }
}
