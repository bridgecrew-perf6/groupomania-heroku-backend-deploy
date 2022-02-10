const Sequelize = require('sequelize')
const db = require('../config/database-config')
const Article = require('./Article')
const User = require('./User')
const Profile = require('./Profile')

const Comment = db.define('comment', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  imageUrl: {
    type: Sequelize.STRING,
    allowNull: true,
    /* validate: {
      isUrl: true,
    }, */
  },
  userId: {
    type: Sequelize.UUID,
    defaultValue: User.id,
    allowNull: false,
  },
  articleId: {
    type: Sequelize.UUID,
    defaultValue: Article.id,
    allowNull: false,
  },
  profileId: {
    //! isInit a Comment creation (should allowNull : false btw)
    type: Sequelize.UUID,
    defaultValue: Profile.id,
    allowNull: false,
  },
})

Article.hasMany(Comment)
Comment.belongsTo(Article)

User.hasMany(Comment)
Comment.belongsTo(User)

Profile.hasMany(Comment)
Comment.belongsTo(Profile) //! This way associated profile appears when we fetch Comment List
/* Comment.sync({ force: true }) */

module.exports = Comment
