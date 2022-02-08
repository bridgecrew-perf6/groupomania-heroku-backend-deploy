const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')

exports.sanitize = (string) => {
  const { window } = new JSDOM('').window
  const DOMPurify = createDOMPurify(window)

  return DOMPurify.sanitize(string)
}
