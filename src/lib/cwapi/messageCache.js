const debug = require('debug')('memex:lib:cwapi:cache')

const BreakException = {}

module.exports = () => {
  const store = new Map()
  const cache = {}

  cache.add = (id, message, opts) => {
    store.set(id, { message, ...opts })
  }

  cache.find = query => {
    const conditions = Object.entries(query)
    let result = null
    try {
      store.forEach((data, id) => {
        const found = conditions.every(([field, value]) =>
          field === 'id'
            ? id === value
            : field.includes('.')
              ? field.split('.').reduce((path, sub) => path[sub] || {}, data) === value
              : data[field] && data[field] === value
        )
        if (found) {
          result = { id, ...data }
          throw BreakException
        }
      })
    } catch (err) {
      if (err !== BreakException) debug('Unknown error:', err)
    }
    return result
  }

  cache.remove = query => {
    const message = cache.find(query)
    return message && store.delete(message.id)
  }

  return cache
}
