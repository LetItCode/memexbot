const path = require('path')
const fs = require('fs')

module.exports = Object.fromEntries(
  fs
    .readdirSync(__dirname)
    .filter(file => file !== 'index.js')
    .map(file => [
      // Kebab to Camel, not otherwise
      file.match(/(.+)\.js/)[1].replace(/-./g, kebab => kebab.substr(1).toUpperCase()),
      require(path.join(__dirname, file))
    ])
)
