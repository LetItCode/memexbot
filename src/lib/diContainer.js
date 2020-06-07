const fnArgs = require('parse-fn-args')

module.exports = () => {
  const dependencies = {}
  const factories = {}
  const diContainer = {}

  diContainer.register = (name, dependency) => {
    dependencies[name] = dependency
  }

  diContainer.factory = (name, factory) => {
    factories[name] = factory
  }

  diContainer.inject = factory => {
    const args = fnArgs(factory).map(dependency => diContainer.get(dependency))
    return factory.apply(null, args)
  }

  diContainer.get = name => {
    if (!dependencies[name]) {
      const factory = factories[name]
      dependencies[name] = factory && diContainer.inject(factory)
      if (!dependencies[name]) {
        throw new Error(`Cannot find module: ${name}`)
      }
    }
    return dependencies[name]
  }

  return diContainer
}
