/**
 * isAuthorized
 *
 * @description :: Policy to check if user is authorized with JSON web token
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

var jwToken = require('../services/jwTokens')

module.exports = function (req, res, next) {

  var token

  if (req.headers && req.headers.authorization) {
    var parts = req.headers.authorization.split(' ')
    if (parts.length === 2) {
      var scheme = parts[0],
        credentials = parts[1]

      if (/^Bearer$/i.test(scheme)) {
        token = credentials
      }
    } else {

      if (_.includes(['auth/logout', 'clients/find-current'], req.options.action )) {
        return next()
      } else {
        return res.unauthorized('Format is Authorization: Bearer [token]')
      }
    }
  } else if (req.param('token')) {
    token = req.param('token')
    delete req.query.token
  }

  if (token) {
    jwToken.verify(token, async function (err, tokenPayload) {
      if (err) {

        if (_.includes(['auth/logout', 'clients/find-current'], req.options.action )) {
          return next()
        } else {
          return res.unauthorized('E_TOKEN_INVALID')
        }
      }

      const blacklistedToken = await BlacklistedToken.find({
        token: token,
      })

      if (blacklistedToken && blacklistedToken.length) {

        if (_.includes(['auth/logout', 'clients/find-current'], req.options.action )) {
          return next()
        } else {
          return res.unauthorized('E_TOKEN_BLACKLISTED')
        }
      }
      req.token = token
      req.tokenPayload = tokenPayload
      return next()

    })
  } else {
    // No token, so request is anonymous, which is fine
    return next()
  }

}
