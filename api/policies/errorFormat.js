/**
 * requestContext
 *
 * @description :: Registers if the client accepts the extended, localized error format.
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {

  req.clientAcceptsExtendedErrorFormat = !!req.header('X-Yogo-Client-Accepts-Extended-Error-Format')

  return next()

}
