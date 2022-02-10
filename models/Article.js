const Sequelize = require('sequelize')
const db = require('../config/database-config')
const Profile = require('./Profile')

const User = require('./User')

const Article = db.define('article', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },

  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    // todo rename to content
    type: Sequelize.STRING,
    allowNull: false,
  },
  userId: {
    type: Sequelize.UUID,
    defaultValue: User.id,
    allowNull: true,
  },
  imageUrl: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  likesCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  doesUserLikes: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  profileId: {
    type: Sequelize.UUID,
    defaultValue: Profile.id,
    allowNull: true,
  },
})

User.hasMany(Article)
Article.belongsTo(User)
Profile.hasMany(Article)
Article.belongsTo(Profile)

Article.sync({ force: true })

exports.ShowUsersTasks = async () => {
  await db.sync() // ! check if it can be removed
  const users = await User.findAll({ include: [Article] })
  users.map((user) => {
    console.log(`${user.name} has tasks: `)
    const { articles } = user
    articles.map((article) => {
      console.log(` * ${article.decription}`)
    })
  })
}

module.exports = Article
