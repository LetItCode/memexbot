const { CwApi, constants } = require('../lib/cwapi')

module.exports = cwApiToken => {
  const cw = new CwApi(cwApiToken)
  cw.connect()
  return Object.assign(cw, constants)
}
