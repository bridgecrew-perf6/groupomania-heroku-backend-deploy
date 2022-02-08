// ! sqlite connection
const Sequelize = require('sequelize')
const dotenv = require('dotenv')

dotenv.config()
const { DIALECT } = process.env
const { PATH_TO_DB } = process.env

const db = new Sequelize({
  dialect: DIALECT,
  storage: PATH_TO_DB,
})
module.exports = db
