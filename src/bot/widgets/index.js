const path = require('path')
const fs = require('fs')

module.exports = fs
  .readdirSync(__dirname)
  .filter(file => file !== 'index.js')
  .map(file => require(path.join(__dirname, file)))
