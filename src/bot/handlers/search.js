const debug = require('debug')('memex:bot:handlers:search')
const { safePassThru } = require('telegraf')

module.exports = async (ctx, next) => {
  const { inlineQuery, answerInlineQuery, db, h } = ctx

  if (!inlineQuery.query.startsWith('find:')) return next()

  const query = inlineQuery.query.substr(5)
  if (query.length <= 1) return safePassThru()

  debug(`search... ${query}`)
  const users = await db.User.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } }
    ]
  })
  if (!users.length) return answerInlineQuery()

  const answer = users.map(user => {
    const fullName = h.fullName(user)
    return {
      type: 'article',
      id: user.telegramId,
      title: fullName,
      description: `${user.telegramId} :: @${user.username}`,
      input_message_content: {
        message_text: `${fullName}\n${user.telegramId} :: @${user.username}`
      }
    }
  })

  return answerInlineQuery(answer, { cache_time: 2 })
}
