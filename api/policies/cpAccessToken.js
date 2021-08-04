/**
 * requestContext
 *
 * @description :: Policy to register which app sent the request. This can very easily be spoofed, of course, so it is only to be used as an indication.
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {

  req.accessToken = req.header('Yogo-Access-Token');
  const yogo_access_token = sails.config.integrations.classpass_com.yogo_access_token;

  if (req.accessToken && req.accessToken == yogo_access_token) {
    return next();
  } else {
    return res.forbidden('You are not permitted to perform this action.');
  }

}
