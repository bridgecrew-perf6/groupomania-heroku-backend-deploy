const Sequelize = require('sequelize')
const db = require('../config/database-config')
const Article = require('./Article')
const User = require('./User')

const Like = db.define('like', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },
  articleId: {
    type: Sequelize.UUID,
    defaultValue: Article?.id,
    allowNull: true,
  },
  userId: {
    /* //! might switch to userID but i am afraid it conflicts */
    type: Sequelize.UUID,
    defaultValue: User?.id,
    allowNull: true,
  },
  value: {
    type: Sequelize.ENUM(
      'like',
      'disliked',
      'default'
    ) /* Sequelize.STRING , */,
    defaultValue: 'default',
  },
})

Article.hasMany(Like) //!   had a hasMany relation setup first
Like.belongsTo(Article) //! BUT for every entry in table like, it is only associated
User.hasMany(Like) //!      with one article and one user
Like.belongsTo(User)
// Like.sync({ force: true })
module.exports = Like
