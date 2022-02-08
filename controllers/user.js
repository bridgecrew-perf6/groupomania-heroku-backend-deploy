// TODO signup: check for more error case + validate either with sequelize or xpress-validator

const bcrypt = require('bcrypt')
const dotenv = require('dotenv')

dotenv.config()
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const { extractUser } = require('../middleware/get-token')
const User = require('../models/User')

const { ADMIN_MASTER_EMAIL, ADMIN_MASTER_PASS } = process.env

exports.signup = async (req, res, next) => {
  const errors = validationResult(req)//! normalize email in route/user - checks for strong password
  if (!errors.isEmpty()) {
    console.error(errors.array())
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const userStored = await User.findOne({ where: { email: req.body.email } })
    if (userStored) {
      const error = new Error('User already in DB. Choose another email')
      error.code = 'auth/email-already-in-use'
      return res.status(401).json({ error })
    }
  } catch (err) {
    res.status(500).json({ error: new Error(err) })
  }
  try {
    const hash = await bcrypt.hash(req.body.password, 10)
    bcrypt.compare(ADMIN_MASTER_PASS, hash)
      .then(async (valid) => {
        const newUser = await User.create({
          email: req.body.email,
          password: hash, //! MASTER ACCOUNT IS GOING TO PROMOTE OTHERS ACCOUNTS TO ADMIN STATUS
          isAdmin: ((req.body.email === ADMIN_MASTER_EMAIL) && valid),
        })
        res.status(201).json({ message: 'Utilisateur créé' })
      })
  } catch (error) {
    res.status(400).json({ error }) //! might wanna separate different error codes  now i hav all inside try catch
  }
}
exports.login = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  User.findOne({ where: { email: req.body.email } })
    .then((user) => {
      if (!user) {
        const error = new Error('Utilisateur inconnu dans DB')
        error.code = 'auth/user-not-found' //! to trigger toast in front
        return res.status(401).json(error)
      }
      bcrypt.compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            const error = new Error('Mot de passe incorrect!')
            error.code = 'auth/wrong-password' //! to trigger toast in front
            return res.status(401).json(error)
          }
          res.status(200).json({
            userId: user.id,
            token: jwt.sign(
              { userId: user.id },
              'RANDOM_TOKEN_SECRET', // TODO REFRESH
              { expiresIn: '24h' },
            ),
            isAdmin: user.isAdmin, //! allows user to acces protected routes
          })
        })
        .catch((error) => res.status(500).json({ error }))
    })
    .catch((error) => res.status(500).json({ error }))
}

exports.getUserById = (req, res, next) => {
  const { id } = req.params //! might want to check against id extracted from token
  User.findOne({ where: { id }, include: { all: true } }) //! might be weird
    .then((user) => {
      res.status(200).json(user)
    })
    .catch((error) => res.status(500).json({ error }))
}

exports.getAllUsers = (req, res, next) => {
  const userId = extractUser(req)
  /*  User.findOne({ where: { id: userId }, include: { all: true } })
    .then((user) => {
       if (user.isAdmin !== true) {
        return res.status(403).json({ error: 'Unauthorized user: needs admin rights' })
      }  //! triple check
    })
    .catch((error) => res.status(500).json({ error })) */
  User.findAll({ include: { all: true } })
    .then((users) => res.status(200).json(users))
}

exports.deleteUser = (req, res, next) => {
  const { id } = req.params //! might want to check against id extracted from token
  User.findOne({ where: { id }, include: { all: true } }) //! might be weird
    .then((user) => {
      user.destroy()
        .then(() => res.status(200).json({ message: 'Utilisateur supprimé' }))
        .catch((error) => res.status(500).json({ error: new Error(error) }))
    })
    .catch((error) => res.status(500).json({ error: new Error(error) }))
}
