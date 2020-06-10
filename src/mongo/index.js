const mongoose = require('mongoose')

module.exports = mongoUri => {
  mongoose.connect(mongoUri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })

  const database = {}

  // Users
  const userSchema = new mongoose.Schema({
    telegramId: Number,
    username: String,
    firstName: String,
    lastName: String,
    token: String,
    grants: [String]
  })

  database.User = mongoose.model('User', userSchema)

  // News
  const newsSchema = new mongoose.Schema({
    emoji: { type: String, default: '✨' },
    url: String,
    title: String,
    expire: { type: Date, index: { expires: '3d' } }
  })

  database.News = mongoose.model('News', newsSchema)

  // Triggers
  const triggerSchema = new mongoose.Schema({
    trigger: String,
    chatId: Number,
    type: String,
    text: String
  })

  database.Trigger = mongoose.model('Trigger', triggerSchema)

  // Export models like 'database'
  return database
}
