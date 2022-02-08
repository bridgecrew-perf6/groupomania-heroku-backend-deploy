/* eslint-disable max-len */
const fs = require('fs')
const dotenv = require('dotenv')
const { validationResult } = require('express-validator')
const Article = require('../models/Article')
const User = require('../models/User')
const { extractUser } = require('../middleware/get-token')
const Profile = require('../models/Profile')
const { sanitize } = require('../middleware/dompurify')

dotenv.config()

exports.getAllUsers = (req, res, next) => {
  User.findAll({ include: { all: true } })
    .then((data) => res.status(200).json(data))
    .catch((error) => res.status(500).json(error))
}

exports.createProfile = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const array = errors.errors.filter((error) => {
      const { param, value, msg } = error
      if (param === 'userPicUrl' && value === undefined && msg === 'URL incorrecte') return false
      return true
    })// undefined userPicUrl are allowed
    if (array.length) {
      return res.status(400).json({ errors: array })
    }
  }
  const { protocol, file, body } = req
  let userPicUrl = ''
  const userId = extractUser(req)

  if (file != null) {
    userPicUrl = `${protocol}://${req.get('host')}/images/${file.filename}`
  }

  const profile = {
    ...body,
    userName: sanitize(body.userName),
    location: sanitize(body.location),
    userPicUrl,
    userId,
  } // ! ties profile with userId found in headers
  if (profile.userId !== userId) {
    return res.status(403).json({ error: new Error('unauthorized request!') })
  }
  const newProfile = new Profile(profile)
  newProfile.save()
    .then((data) => {
      const profileId = data.id
      User.update({
        profileId,
      }, { where: { id: userId } }) //! only owner creates profile so we don't care about admin
        .then((userData) => console.log(userData))
        .catch((err) => res.status(500).json({ error: new Error(`${err}`) }))
      res.status(201).json(data)
    })
    .catch((err) => res.status(500).json({ error: new Error(`${err}`) }))
}

exports.getOneProfile = (req, res, next) => {
  Profile.findOne({ where: { userId: req.params.id }, include: { all: true } })
    .then((profile) => res.status(200).json(profile))
    .catch((err) => res.status(404).json({ error: new Error(`${err}`) }))
} /* 404 or 500 status code? */

exports.getAllProfiles = (req, res, next) => {
  Profile.findAll({ include: { all: true } })
    /* .then((response) => response.json()) */
    .then((data) => res.status(200).json(data))
    .catch((err) => res.status(500).json({ error: new Error(`${err}`) }))
}

exports.updateProfile = async (req, res, next) => {
  const result = validationResult(req)
  if (result.errors.length !== 0) {
    const array = result.errors.filter((error) => {
      const { param, value, msg } = error
      if (param === 'profile.userPicUrl' && value === undefined && msg === 'URL incorrecte') return false
      return true
    })// undefined userPicUrl are allowed
    if (array.length !== 0) {
      return res.status(400).json({ errors: array })
    }
  }
  const { protocol, file, body } = req
  const userId = extractUser(req)
  const profile = JSON.parse(body.profile)
  let userPicUrl = ''
  let filename = ''
  let isAdmin = false

  if (file != null) {
    userPicUrl = `${protocol}://${req.get('host')}/images/${file.filename}`
  }
  try {
    const resquestingUserProfile = await Profile.findOne({ where: { userId }, include: { all: true } })
    if (resquestingUserProfile.user.isAdmin === true) {
      isAdmin = true
    }
  } catch (error) {
    res.status(500).json({ error: new Error(`${error}`) })
  }

  const callback = (oldProfile) => {
    oldProfile.update({
      ...profile,
      userName: sanitize(profile.userName),
      location: sanitize(profile.location),
      userPicUrl: sanitize(userPicUrl),
      userId: oldProfile.userId, //! prevents overrides
    })
      .then((response) => {
        res.status(200).json({ message: 'Profil modifié' })
      })
      .catch((err) => res.status(500).json({ error: new Error(`${err}`) }))
  }

  try {
    const oldProfile = await Profile.findOne({ where: { userId: req.params.id }, include: { all: true } })
    if (oldProfile.userId !== userId //! only admin and owner are authorized
          && !isAdmin) { //! Same old !(a || b) = !a && !b
      return res.status(403).json({ error: new Error('unauthorized request!') })
    }
    if (oldProfile.userPicUrl) {
      filename = oldProfile.userPicUrl.split('/images/')[1]
    }

    if (filename) {
      fs.unlink(`images/${filename}`, () => callback(oldProfile))
    } else {
      callback(oldProfile)
    }
  } catch (err) {
    res.status(500).json({ error: new Error(`${err}`) })
  }
}

exports.deleteProfile = async (req, res, next) => {
  const reqUserId = extractUser(req)
  const userId = req.params.id
  const userPicUrl = ''
  let filename = ''
  let isAdmin = false

  try {
    const resquestingUserProfile = await Profile.findOne({ where: { userId: reqUserId }, include: { all: true } })
    if (resquestingUserProfile.user.isAdmin === true) {
      isAdmin = true
    }
  } catch (error) {
    res.status(500).json({ error: new Error(`${error}`) })
  }

  const callback = async (profile) => {
    try {
      const deletedProfile = await profile.destroy()
      res.status(200).json({ message: 'Profile supprimé' })
    } catch (error) { res.status(500).json({ error: new Error(`${error}`) }) }
  }

  try {
    const storedProfile = await Profile.findOne({ where: { userId }, include: { all: true } })
    if (storedProfile.userId !== reqUserId && !isAdmin) {
      res.status(403).json({ error: new Error('unauthorized request!') })
    }
    if (storedProfile.userPicUrl) {
      filename = storedProfile.userPicUrl.split('/images/')[1]
    }

    if (filename) {
      fs.unlink(`images/${filename}`, () => callback(storedProfile))
    } else {
      callback(storedProfile)
    }
  } catch (err) {
    res.status(500).json({ error: new Error(`${err}`) })
  }
}
