//! https://github.com/nfriedly/express-rate-limit
const rateLimit = require('express-rate-limit')

exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 100, //! test might be too low
})

// Account limiter
exports.createAccountLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 sec window
  max: 10, // start blocking after 5 requests
  error: //! augmented while testing. can / must be finely tuned in production
    'Too many accounts created from this IP, please try again after an hour',
})

// login limiter prevents DDOS attacks
exports.loginLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds window
  max: 100, // starts blocking at 100 logins / 10 secs i.e 10 logins / sec.
  error: // can be tweaked according to needs
      'Too many logins at the same time, throttling to prevent server overload',
})
