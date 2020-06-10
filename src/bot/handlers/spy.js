const { Extra, safePassThru } = require('telegraf')

const Triggers = {
  TEXT: 'text',
  STICKER: 'sticker',
  ANIMATION: 'animation'
}

module.exports = async ctx => {
  const { chat, message, replyWithHTML, replyWithSticker, replyWithAnimation, db } = ctx

  const trigger = await db.Trigger.findOne({ chatId: chat.id, trigger: message.text.toLowerCase() })
  if (!trigger) return safePassThru()

  if (trigger.type === Triggers.TEXT) {
    return replyWithHTML(trigger.text, Extra.inReplyTo(message.message_id))
  }
  if (trigger.type === Triggers.STICKER) {
    return replyWithSticker(trigger.text, Extra.inReplyTo(message.message_id))
  }
  if (trigger.type === Triggers.ANIMATION) {
    return replyWithAnimation(trigger.text, Extra.inReplyTo(message.message_id))
  }
}
