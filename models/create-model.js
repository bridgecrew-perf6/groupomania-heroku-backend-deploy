const User = require('./User')

exports.create = async (user) => {
  const newUser = new User(user)
  return newUser.save()
}
