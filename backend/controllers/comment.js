/* eslint-disable max-len */
/* eslint-disable prefer-destructuring */
const fs = require('fs')
const { validationResult } = require('express-validator')
const { extractUser } = require('../middleware/get-token')
const Comment = require('../models/Comment')
const User = require('../models/User')
const Profile = require('../models/Profile')
const { sanitize } = require('../middleware/dompurify')

exports.postComment = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const { protocol, file, body } = req
  const userId = extractUser(req)
  let profileId = null
  try {
    const associatedProfile = await Profile.findOne({ where: { userId }, include: { all: true } })
    profileId = associatedProfile.id
  } catch (err) {
    res.status(500).json({ error: new Error(err) })
  }
  const articleId = req.params.id
  let imageUrl = ''
  let comment = {}
  const rawComment = JSON.parse(body.comment)
  if (file != null) {
    imageUrl = `${protocol}://${req.get('host')}/images/${file.filename}`
  }
  comment = {
    ...rawComment,
    description: sanitize(rawComment.description),
    userId,
    articleId,
    profileId,
  }

  if (imageUrl) comment.imageUrl = imageUrl
  const newComment = new Comment(comment)
  try {
    const data = await newComment.save()
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: new Error(err) })
  }
}

exports.listComments = (req, res, next) => {
  const userId = extractUser(req)
  const articleId = req.params.id

  Comment.findAll({ include: { all: true }, where: { articleId }, order: [['createdAt', 'DESC']] }) /* same for include */
    .then((data) => res.status(200).json(data))
    .catch((err) => res.status(500).json(err))
}

exports.getOneComment = async (req, res, next) => {
  const { commentId } = req.params
  try {
    const data = await Comment.findOne({ where: { id: commentId } })
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: new Error(err) })
  }
}

exports.updateComment = async (req, res, next) => { // ! REFACTOR FFS
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const { protocol, file, body } = req // todo refactor modify article and updateProfile
  const userId = extractUser(req)// todo  the same way with a callback
  const articleId = req.params.id
  const { commentId } = req.params

  let isAdmin = false
  try {
    const userStored = await User.findByPk(userId)
    if (userStored.isAdmin === true) {
      isAdmin = true
    }
  } catch (error) {
    res.status(500).json({ error: new Error(`${error}`) })
  }

  const newComment = JSON.parse(body.comment)
  let imageUrl = null

  const callback = async (comment) => { //! extracted while refactoring DRY
    try {
      const updatedComment = await Comment.update(
        {
          ...newComment,
          description: sanitize(newComment.description),
          imageUrl: sanitize(imageUrl), //! our param comment will in that case be commentStored, effectively preventing injection
          userId: comment.userId, // ! overrides potential injected values with postman /example
          articleId: comment.articleId, // todo CHECK IF THIS IS NOT IN FACT AN OVERRIDDE when updated by admin
        }, { where: { id: commentId } }, //! remove userId and articleId
      )
      res.status(200).json({ message: 'Commentaire modifié' })
    } catch (error) {
      return res.status(500).json({ error: new Error(error) })
    }
  }

  try {
    const commentStored = await Comment.findOne({ where: { id: commentId } })// todo remove useless check for articleId = res.params.id
    if ((commentStored.userId !== userId || commentStored.articleId !== articleId) && !isAdmin) {
      return res.status(403).json({ error: new Error('unauthorized request!') })
    }

    let filename = ''
    if (file != null) { //! undefined != null  !!undefined === !!null
      imageUrl = `${protocol}://${req.get('host')}/images/${file.filename}`
    }
    if (commentStored.imageUrl) {
      filename = commentStored.imageUrl.split('/images/')[1]
    }
    if (filename) {
      fs.unlink(`images/${filename}`, () => callback(commentStored))
    } else {
      callback(commentStored)
    }
  } catch (error) {
    return res.status(404).json({ error: new Error(error) })
  }
}

exports.deleteComment = async (req, res, next) => { // ! REFACTOR FFS
  const userId = extractUser(req)
  const articleId = req.params.id
  const { commentId } = req.params

  let isAdmin = false
  try {
    const userStored = await User.findByPk(userId)
    if (userStored.isAdmin === true) {
      isAdmin = true
    }
  } catch (error) {
    res.status(500).json({ error: new Error(`${error}`) })
  }
  // eslint-disable-next-line consistent-return
  const callback = async (comment) => {
    try {
      const deletedComment = await comment.destroy()
      res.status(200).json({ message: 'Commentaire supprimé' })
    } catch (error) {
      res.status(500).json({ error: new Error(error) })// todo get rid of useless returns
    }
  }

  try { // todo remove articleId checking
    const commentStored = await Comment.findOne({ where: { id: commentId } })
    if ((commentStored.userId !== userId || commentStored.articleId !== articleId) && !isAdmin) { //! second check
      return res.status(403).json({ error: new Error('unauthorized request!') })//! might be useless
    }
    let filename = ''
    if (commentStored.imageUrl) {
      filename = commentStored.imageUrl.split('/images/')[1]
    }

    if (filename) {
      fs.unlink(`images/${filename}`, () => callback(commentStored))
    } else {
      callback(commentStored)
    }
  } catch (error) {
    return res.status(404).json({ error: new Error(error) })
  }
}
//! not sure it gets less verbose using async / await
