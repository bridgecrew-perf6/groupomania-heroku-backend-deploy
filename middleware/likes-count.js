const Article = require('../models/Article')
const Like = require('../models/Like')

const handleLike = (article, idFoundInHeaders) => (Like.findAndCountAll({ where: { articleId: article.id } })
  .then(({ count, rows }) => { //! gives a 200 code whenever debugger hits there ...
    const userFound = rows.find((like) => like.userId === idFoundInHeaders)
    const doesUserLikes = () => { //! REMOVE
      if (userFound == []) {
        return false
      } if (userFound === idFoundInHeaders) {
        return true
      }
      return false
    }
    article.update(
      {
        /* ...article, */
        likesCount: count,
        // eslint-disable-next-line no-unneeded-ternary
        doesUserLikes: (!userFound ? false : true), /* // ! i.e (userFound ? true: false) */
      },
    )
      .then((data) => data)
      .catch((err) => console.log(err))
    return article
  })
  .catch((err) => console.log(err)))
module.exports = handleLike
