/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const jwt = require('jsonwebtoken')
const fs = require('fs')
const { validationResult } = require('express-validator')
const Article = require('../models/Article')
const User = require('../models/User')
const Like = require('../models/Like')
const Profile = require('../models/Profile')
const handleLike = require('../middleware/likes-count')
const { extractUser } = require('../middleware/get-token')
const { sanitize } = require('../middleware/dompurify')

exports.addArticle = async (req, res, next) => {
  const result = validationResult(req)
  if (result.errors.length !== 0) {
    const array = result.errors.filter((error) => {
      const { param, value, msg } = error
      if (param === 'imageUrl' && value === undefined && msg === 'URL incorrecte') return false
      return true
    })// undefined imageUrl are allowed
    if (array.length) {
      return res.status(400).json({ errors: array })
    }
  }
  const { protocol, file, body } = req
  let imageUrl = ''
  if (file != null) {
    imageUrl = `${protocol}://${req.get('host')}/images/${file.filename}`
  }
  const userId = extractUser(req)
  let profileId = null
  try {
    const associatedProfile = await Profile.findOne({ where: { userId }, include: { all: true } })
    profileId = associatedProfile.id
  } catch (err) {
    res.status(500).json({ error: new Error(err) })
  }

  const article = {
    ...body,
    title: sanitize(body.title), //! NTUI
    description: sanitize(body.description),
    userId,
    profileId,
  }
  if (imageUrl) article.imageUrl = sanitize(imageUrl) /* might even not need this as imageUrl='' */
  const newArticle = new Article(article)
  newArticle.save()
    .then((data) => res.status(201).json(data))
    .catch((err) => res.status(500).json({ error: new Error(err) }))
}

exports.listArticles = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1] // Notre token est de la forme BEARER
  const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET')
  const { userId } = decodedToken
  /* const userId = '06f1743d-1a2c-434f-84bc-4a6daf3067f6' */

  Article.findAll({ include: { all: true }, order: [['createdAt', 'DESC']] })
    .then(async (response) => {
      for (const article of response) { // ! go back to plain map
        await handleLike(article, userId)
      }

      return response
    })
    .then((data) => res.status(200).json(data))
    .catch((err) => res.status(404).json(err))
}

exports.modifyArticle = async (req, res, next) => {
  const result = validationResult(req)
  if (result.errors.length !== 0) {
    const array = result.errors.filter((error) => {
      const { param, value, msg } = error
      if (param === 'imageUrl' && value === undefined && msg === 'URL incorrecte') return false
      return true
    })// undefined imageUrl are allowed
    if (array.length) {
      return res.status(400).json({ errors: array })
    }
  }
  const {
    protocol, body, file,
  } = req

  const userId = extractUser(req)
  let isAdmin = false // ! we determine if current user is admin
  try { //! this way they can moderate posts
    const requestingUser = await User.findByPk(userId)
    if (requestingUser.isAdmin === true) {
      isAdmin = true
    }
  } catch (error) {
    res.status(500).json({ error: new Error(`${error}`) })
  }

  const article = JSON.parse(body.article)
  let imageUrl = null

  const callback = async (articleStored) => {
    try {
      const updatedArticle = await articleStored.update(
        {
          ...article,
          title: sanitize(article.title),
          description: sanitize(article.description),
          imageUrl,
          userId: articleStored.userId, //! prevents overrides
          articleId: articleStored.articleId,
        },
      )
      res.status(200).json({ message: 'Article modifié' })
    } catch (err) {
      res.status(500).json({ error: new Error(`${err}`) })
    }
  }

  Article.findOne({ where: { id: req.params.id } })
    .then((articleStored) => {
      if (articleStored.userId !== userId && !isAdmin) {
        return res.status(403).json({ error: new Error('unauthorized request!') })
      }
      let filename = ''
      if (file != null) {
        imageUrl = `${protocol}://${req.get('host')}/images/${file.filename}`
      }
      if (articleStored.imageUrl) {
        filename = articleStored.imageUrl.split('/images/')[1]
      }
      if (filename) { // '' == false, as undefined and null
        fs.unlink(`images/${filename}`, () => callback(articleStored))
      } else {
        callback(articleStored)
      }
    })
    .catch((error) => res.status(500).json({ error }))
}

exports.getOneArticle = (req, res, next) => {
  Article.findOne({ where: { id: req.params.id }, include: { all: true } }) // todo find a way to include [User]
    .then((article) => res.status(200).json(article))
    .catch((error) => res.status(404).json({ error }))
}

exports.deleteArticle = async (req, res, next) => { // TODO CHECK IF I NEED A TRY ... CATCH AS IN AUTH.JS
  const token = req.headers.authorization.split(' ')[1] //! check auth.js if in doubt
  const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET')//! tested with thunder . i DO need to prevent unauthorized actions
  const { userId } = decodedToken
  let isAdmin = false
  try {
    const requestingUser = await User.findByPk(userId)
    if (requestingUser.isAdmin === true) {
      isAdmin = true
    }
  } catch (error) {
    res.status(500).json({ error: new Error(`${error}`) })
  }
  const callback = async (article) => {
    try {
      const response = await article.destroy()
      res.status(200).json({ message: 'Objet supprimé' })
    } catch (err) {
      return res.status(500).json({ error: new Error(err) })
    }
  }
  try {
    const article = await Article.findByPk(req.params.id)// todo are we covered in case of an null imageUrl?
    if (article.userId !== userId && !isAdmin) { //! so admin can delete posts
      return res.status(403).json({ error: new Error('unauthorized request!') })
    }
    if (!article) {
      res.status(404).json({ message: 'article not found in DB' })
    }
    if (article.imageUrl) {
      const filename = article.imageUrl.split('/images/')[1]
      fs.unlink(`images/${filename}`, () => callback(article))
    } else {
      callback(article)
    }
  } catch (err) {
    return res.status(500).json({ error: new Error(err) })
  }
}

exports.likeArticle = (req, res, next) => { // todo : remove userId from body as it is only prone to attacks
  const reqObject = req.body // lamest name //todo as an auth user can can whatever likes he wants
  const { value } = reqObject; /* ASI freaks out otherwise */ // todo or at least restore userId check
  const userId = extractUser(req) //! NOT WORKING ATM NEED TO DOUBLE CHECK
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  /* if (idExtractedFromToken !== userId) {
    return res.status(403).json({ error: new Error('unauthorized request!') })
  } */ // ! don't need it as every user can like a post

  Like.findOne({ where: { articleId: req.params.id, userId } })
    .then((entry) => { //! findOne find the first entry so duplicate entries should not be a problem
      if (entry === null && value !== 'default') {
        const likedArticleObj = { ...reqObject, articleId: req.params.id, userId }
        const likedArticle = new Like(likedArticleObj)
        likedArticle.save()
          .then((data) => res.status(201).json(data))
          .catch((err) => console.log(err))
      } else if (value === 'default') {
        entry.destroy()
          .then((data) => res.status(200).json(data))
          .catch((err) => console.log(err))
      } else {
        entry.update({
          ...reqObject,
          articleId: req.params.id,
          userId,
        })
          .then((data) => res.status(200).json(data))
          .catch((err) => console.log(err))
      }
    })
    .catch((error) => res.status(500).json({ error }))
}

/* // ! get current Likes for a determined post . return a boolean checking wheter curent user likes said article */
// todo check on backend if i stil need likesCount and doesUserLikes in Article model

exports.getLikes = (req, res, next) => {
  const userId = extractUser(req)
  return (
    Like.findAndCountAll({ where: { articleId: req.params.id } })
      .then(({ count, rows }) => {
        const userFound = rows.find(((like) => like.userId === userId))
        const response = {
          likesCount: count,
          doesUserLikes: (!!userFound),
        }
        return res.status(200).json(response)
      })
      .catch((error) => res.status(500).json({ error: new Error(`${error}`) }))
  )
}
