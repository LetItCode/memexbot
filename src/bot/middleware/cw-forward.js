const { optional } = require('telegraf')

module.exports = (...fns) =>
  optional(({ message }) => message.forward_from && message.forward_from.id === 265204902, ...fns)
