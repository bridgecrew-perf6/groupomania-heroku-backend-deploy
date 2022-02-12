const Sequelize = require('sequelize') // TODO check for more validation constrains like isUrl ..
const db = require('../config/database-config')
const User = require('./User')

const Profile = db.define('profile', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  }, //! can we remove and setup userId as PK?
  userName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userId: {
    type: Sequelize.UUID,
    defaultValue: User.id,
    allowNull: false,
  },
  userPicUrl: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  location: {
    type: Sequelize.STRING,
    allowNull: true,
  },
})

Profile.belongsTo(User, { constraints: false })
Profile.hasOne(User)
User.belongsTo(Profile, { constraints: false })
User.hasOne(Profile)
Profile.sync()

module.exports = Profile
