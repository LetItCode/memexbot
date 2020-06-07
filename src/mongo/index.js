const mongoose = require('mongoose')

module.exports = mongoUri => {
  mongoose.connect(mongoUri, {
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
    grants: []
  })

  database.User = mongoose.model('User', userSchema)

  // Export models like 'database'
  return database
}
