const express = require('express')

const app = express()
/* const mongoose = require('mongoose')
const dotenv = require('dotenv') */
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
const hpp = require('hpp')

const db = require('./config/database-config')
const userRoutes = require('./routes/user')
const userListRoutes = require('./routes/user-list')
const articleRoutes = require('./routes/article')

/* const mongoSanitize = require('express-mongo-sanitize')

const { apiLimiter } = require('./middleware/express-rate-limit') */
const Article = require('./models/Article')
const { apiLimiter } = require('./middleware/express-rate-limit')

// ! DB connection
db.authenticate()
  .then(() => {
    console.log('Database connected...')
  })
  .catch((err) => {
    console.log(`Error: ${err}`)
  })
const corsOptions = {
  origin: 'https://groupomania-test-deploy-aurelien-guillaudon.netlify.app',
}
app.use(cors({ origin: '*' }))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*') //! so we can test with a random phone
  next() //! might be a security issue though
})
app.use(helmet({ crossOriginEmbedderPolicy: true })) // headers config
// Sets "Cross-Origin-Resource-Policy: cross-origin"
// app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

app.use(express.json())

app.use(hpp()) //! Prevents query parameter pollution

app.options('*', cors()) // enables pre-flight requests before other routes
/* // Sanitization prevents SQL injection
app.use(
  mongoSanitize({
    replaceWith: '_',
  }),
) */
//! indique comment traiter les requetes vers la route /image
app.use('/images', express.static(path.join(__dirname, 'images')))
/* app.use('/upload', fileRoutes) */

//! Express-rate-limit

//! temp dummy route DO NOT FORGET TO REMOVE ==> we need it for admin purposes after all
//! might find a use for it on the other hand for profile creation + admin user listing
app.use('/api/users', apiLimiter, userListRoutes)
app.use('/api/articles', apiLimiter, articleRoutes)

app.use('/api/auth', userRoutes) //! more limitations on route/user.js
//! hit 429 if we hit this route too often
module.exports = app
// npm uninstall node-pre-gyp --save
