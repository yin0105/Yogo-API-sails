/**
 * requestContext
 *
 * @description :: Policy to register which app sent the request. This can very easily be spoofed, of course, so it is only to be used as an indication.
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {

  req.requestContext = req.header('X-Yogo-Request-Context')

  switch (req.requestContext) {
    case 'admin':
      if (req.user && req.user.admin) {
        req.authorizedRequestContext = 'admin'
      }
      break
    case 'teacher':
      if (req.user && req.user.teacher) {
        req.authorizedRequestContext = 'teacher'
      }
      break
    default:
      if (req.user && req.user.customer) {
        req.authorizedRequestContext = 'customer'
      } else if (req.checkin) {
        req.authorizedRequestContext = 'checkin'
      } else {
        req.authorizedRequestContext = 'public'
      }
      break
  }

  return next()

}
