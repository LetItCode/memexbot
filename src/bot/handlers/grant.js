const debug = require('debug')('memex:bot:handlers:grant')
const { safePassThru } = require('telegraf')

module.exports = async ctx => {
  const { match, from, replyWithHTML, session, i18n, db, cw } = ctx
  const { code, grants = '' } = match.groups

  const Grants = { ...cw.Operations, AUTH: 'auth' }

  const user = await db.User.findOne({ telegramId: from.id })
  if (!user) return safePassThru()

  if (!session.auth || !session.auth.pending) return safePassThru()

  let authType = Grants.AUTH
  if (grants.includes('profile')) authType = Grants.PROFILE
  if (grants.includes('stock')) authType = Grants.STOCK
  if (grants.includes('gear')) authType = Grants.Gear
  if (session.auth.type !== authType) return safePassThru()

  try {
    if (authType === Grants.AUTH) {
      const res = await cw.grantToken(from.id, code)
      db.User.updateOne(
        { telegramId: from.id },
        { $set: { token: res.payload.token }, $addToSet: { grants: authType } }
      ).exec()
    } else {
      await cw.grantAdditionalOperation(user.token, session.auth.uuid, code)
      db.User.updateOne({ telegramId: from.id }, { $addToSet: { grants: authType } }).exec()
    }

    session.auth.pending = false

    const text = i18n.t('auth.success')

    return replyWithHTML(text)
  } catch (err) {
    debug('Grant error:', err)
  }
}
