// ! sqlite connection
const { Client } = require('pg')

const Sequelize = require('sequelize')
const dotenv = require('dotenv')

dotenv.config()
const { DIALECT } = process.env
const { PATH_TO_DB } = process.env
const { DB_URL, DB_USER, DB_PASSWORD, DATABASE_URL, JAWSDB_URL } = process.env

const db = new Sequelize(
  /* {
  dialect: 'postgres',
  HOST: DB_URL,
  USER: DB_USER,
  PASSWORD: DB_PASSWORD,
  pool: {
    connectionLimit: 5,
    // 'connectTimeout' is the maximum number of milliseconds before a timeout
    // occurs during the initial connection to the database.
    connectTimeout: 10000, // 10 seconds
    // 'acquireTimeout' is the maximum number of milliseconds to wait when
    // checking out a connection from the pool before a timeout error occurs.
    acquireTimeout: 10000, // 10 seconds
    // 'waitForConnections' determines the pool's action when no connections are
    // free. If true, the request will queued and a connection will be presented
    // when ready. If false, the pool will call back with an error.
    waitForConnections: true, // Default: true
    // 'queueLimit' is the maximum number of requests for connections the pool
    // will queue at once before returning an error. If 0, there is no limit.
    queueLimit: 0, // Default: 0
  },
} */ JAWSDB_URL,
  {
    dialect: 'mysql',
    /* port: 5432, */
    dialectOptions: {
      //! no pg_a_..conf otherwise
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      connectionLimit: 5,
      // 'connectTimeout' is the maximum number of milliseconds before a timeout
      // occurs during the initial connection to the database.
      connectTimeout: 10000, // 10 seconds
      // 'acquireTimeout' is the maximum number of milliseconds to wait when
      // checking out a connection from the pool before a timeout error occurs.
      acquireTimeout: 10000, // 10 seconds
      // 'waitForConnections' determines the pool's action when no connections are
      // free. If true, the request will queued and a connection will be presented
      // when ready. If false, the pool will call back with an error.
      waitForConnections: true, // Default: true
      // 'queueLimit' is the maximum number of requests for connections the pool
      // will queue at once before returning an error. If 0, there is no limit.
      queueLimit: 0, // Default: 0
    },
  }
)
module.exports = db
