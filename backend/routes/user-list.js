const express = require('express')

const router = express.Router()
const { body, check } = require('express-validator')
const auth = require('../middleware/auth')
const userListCtrl = require('../controllers/user-list')
const multer = require('../middleware/multer-config-backup')
const { sanitize } = require('../middleware/dompurify')

router.get('/', auth, userListCtrl.getAllProfiles)
router.post('/', auth, multer,
  body('userName').notEmpty().not('')
    .withMessage('Entrez un username'),
  body('location').notEmpty().not('')
    .withMessage('Entrez une location'),
  body('userPicUrl').isURL({ require_tld: false })
    .withMessage('URL incorrecte'),
  userListCtrl.createProfile)

router.get('/:id', auth, userListCtrl.getOneProfile)
router.put('/:id', auth, multer,
/*   body('profile.*.userName').exists().notEmpty().not('')
    .withMessage('Entrez un username'),
  body('profile.*.location').exists().notEmpty().not('')
    .withMessage('Entrez une location'),
 */
  userListCtrl.updateProfile)
router.delete('/:id', auth, userListCtrl.deleteProfile)
module.exports = router

//! profiles endpoint
// corresonding call
//! app.use('/api/users', userListRoutes)
