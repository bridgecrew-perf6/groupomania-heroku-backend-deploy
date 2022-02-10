const express = require('express')

const router = express.Router()

const { body, check } = require('express-validator')
const auth = require('../middleware/auth')
const multer = require('../middleware/multer-config-backup')

const {
  addArticle,
  listArticles,
  modifyArticle,
  getOneArticle,
  likeArticle,
  getLikes,
  deleteArticle,
} = require('../controllers/article')
const {
  listComments,
  postComment,
  updateComment,
  deleteComment,
  getOneComment,
} = require('../controllers/comment')

router.get(
  '/', // List articles
  auth,
  listArticles
) //! auth compares req.body .. might wanna double check that
router.post(
  '/', // Post Article
  auth,
  multer,
  body('title').notEmpty().not('').withMessage('Veuillez entrez un titre SVP'),
  body('description')
    .notEmpty()
    .not('')
    .withMessage('Veuillez entrez une description SVP'),
  body('imageUrl').isURL({ require_tld: false }).withMessage('URL incorrecte'),
  addArticle
)

router.post(
  '/:id/like', // Like
  auth,
  body('value').isIn(['like', 'default']),
  likeArticle
)

router.post(
  '/:id/comments/', // Post Comment
  auth,
  multer,
  body('comment.*.imageUrl')
    .isURL({ require_tld: false })
    .withMessage('URL incorrecte'),
  postComment
)

router.get('/:id/comments/', auth, listComments) // get Comment list

// ! double check route order
router.get(
  ':id/comments/:commentId', // get one comment
  auth,
  getOneComment
)
router.put(
  '/:id/comments/:commentId', // update one comment
  auth,
  multer,
  body('comment.*.imageUrl')
    .isURL({ require_tld: false })
    .withMessage('URL incorrecte'),
  updateComment
) //! updates one particular comment
router.delete(
  '/:id/comments/:commentId', // delete comment
  auth,
  deleteComment
) //! deletes one particular comment
router.get(
  '/:id/like', // get like for current article
  auth,
  getLikes
)
router.get(
  '/:id', // get One article
  auth,
  getOneArticle
)
router.put(
  '/:id', // update one article
  auth,
  multer,
  body('article.*.imageUrl')
    .isURL({ require_tld: false })
    .withMessage('URL incorrecte'),
  modifyArticle
)
router.delete(
  '/:id', // delete one article
  auth,
  deleteArticle
)

// todo get('/:id/comment/), put('id:/comment)
// todo get('/:id/like)
module.exports = router
