const { safePassThru } = require('telegraf')

const Triggers = {
  TEXT: 'text',
  STICKER: 'sticker'
}

module.exports = async ctx => {
  const { match, message, chat, replyWithHTML, i18n, db } = ctx
  const { cmd, trigger } = match.groups

  const targetMessage = message.reply_to_message

  if (cmd === 'trigger') {
    if (!message.reply_to_message) return safePassThru()

    let answer
    if (targetMessage.text) {
      answer = { type: Triggers.TEXT, text: targetMessage.text }
    } else if (targetMessage.sticker) {
      answer = { type: Triggers.STICKER, sticker: targetMessage.sticker }
    }

    const res = await db.Trigger.updateOne({ chatId: chat.id, trigger }, answer, { upsert: true })

    const text = i18n.t('trigger.add')
    if (res.ok) return replyWithHTML(text)
  }

  if (cmd === 'trigger_remove') {
    const res = await db.Trigger.deleteOne({ chatId: chat.id, trigger })

    const text = i18n.t('trigger.remove')
    if (res.ok) return replyWithHTML(text)
  }
}
