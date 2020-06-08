const debug = require('debug')('memex:bot:handlers:auth')
const { safePassThru } = require('telegraf')

module.exports = async ctx => {
  const { match, from, replyWithHTML, session, i18n, db, cw } = ctx
  const { cmd, param = 'auth' } = match.groups

  const Grants = { ...cw.Operations, AUTH: 'auth' }

  const user = await db.User.findOne({ telegramId: from.id })
  if (!user) return safePassThru()

  if (cmd === 'auth') {
    let res
    let authType
    try {
      switch (param) {
        case 'auth':
          authType = Grants.AUTH
          res = await cw.createAuthCode(from.id)
          break
        case 'profile':
          authType = Grants.PROFILE
          res = await cw.authAdditionalOperation(user.token, Grants.PROFILE, from.id)
          break
        case 'stock':
          authType = Grants.STOCK
          res = await cw.authAdditionalOperation(user.token, Grants.STOCK, from.id)
          break
        case 'gear':
          authType = Grants.GEAR
          res = await cw.authAdditionalOperation(user.token, Grants.GEAR, from.id)
          break
      }

      session.auth = { pending: true, type: authType, uuid: res.uuid }

      const text = i18n.t('auth.pending')

      return replyWithHTML(text)
    } catch (err) {
      debug('Auth error:', err)
    }
  }
}
