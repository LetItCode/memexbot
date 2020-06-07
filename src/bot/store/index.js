module.exports = cache => {
  const store = cache('sessions')
  const wrap = {}

  wrap.get = key => store.get(key).catch(_ => null)
  wrap.set = (key, session) => store.put(key, session)

  return wrap
}
