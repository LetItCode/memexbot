const debug = require('debug')('memex:bot:handlers:auth')
const { safePassThru } = require('telegraf')

module.exports = async ctx => {
  const { match, from, replyWithHTML, session, i18n, db, cw } = ctx
  const { cmd, param = 'auth' } = match.groups

  const Grants = { ...cw.Operations, AUTH: 'Auth' }
  let authType
  switch (param) {
    case 'auth': authType = Grants.AUTH; break // prettier-ignore
    case 'profile': authType = Grants.PROFILE; break // prettier-ignore
    case 'stock': authType = Grants.STOCK; break // prettier-ignore
    case 'gear': authType = Grants.GEAR; break // prettier-ignore
  }

  const user = await db.User.findOne({ telegramId: from.id })
  if (!user) return safePassThru()

  if (cmd === 'auth') {
    try {
      const res =
        authType === Grants.AUTH
          ? await cw.createAuthCode(from.id)
          : await cw.authAdditionalOperation(user.token, authType, from.id)

      session.auth = { pending: true, type: authType, uuid: res.uuid }

      const text = i18n.t('auth.pending')

      return replyWithHTML(text)
    } catch (err) {
      debug('Auth error:', err)
    }
  }

  if (cmd === 'auth_revoke') {
    console.log(authType)
    try {
      authType === Grants.AUTH
        ? db.User.updateOne({ telegramId: from.id }, { grants: [] }).exec()
        : db.User.updateOne({ telegramId: from.id }, { $pull: { grants: authType } }).exec()

      const text = i18n.t('auth.revoke')

      return replyWithHTML(text)
    } catch (err) {
      debug('Auth revoke error:', err)
    }
  }
}
