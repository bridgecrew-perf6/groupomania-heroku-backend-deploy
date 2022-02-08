const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1] // Notre token est de la forme BEARER
    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET')
    const { userId } = decodedToken
    if (req.body.userId && req.body.userId !== userId) {
      throw 'User ID non valable !'
    } else {
      next()
    }
  } catch (error) {
    res.status(401).json({ error: new Error('unauthorized request!') })
  }
}
