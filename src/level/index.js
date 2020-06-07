const level = require('level')
const sub = require('subleveldown')

const db = level('store')

module.exports = subName => {
  return sub(db, subName, { valueEncoding: 'json' })
}
