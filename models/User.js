const Sequelize = require('sequelize')
const db = require('../config/database-config')
const Profile = require('./Profile')

const User = db.define('user', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },

  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: {
      msg: 'email present in database already',
    },
    validate: {
      //! could remove now express-validator is implemented
      notNull: {
        //! as i am more comfortable dealing with express-validator errors
        msg: 'email required',
      },
      isEmail: {
        msg: 'Provide a valid email address',
      },
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  profileId: {
    type: Sequelize.UUID,
    allowNull: true,
    defaultValue: Profile.id,
  },
})

const update = async () => {
  await User.sync()
}

update()

module.exports = User
