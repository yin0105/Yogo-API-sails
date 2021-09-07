/**
 * requestContext
 *
 * @description :: Policy to register which app sent the request. This can very easily be spoofed, of course, so it is only to be used as an indication.
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {

  const accessToken = req.header('authorization').split(" ");
  const yogo_access_token = sails.config.integrations.classpass_com.yogo_access_token;

  if (accessToken.length > 1 && accessToken[1] == yogo_access_token) {
    return next();
  } else {
    console.log("cpAccessToken")
    return res.forbidden('You are not permitted to perform this action.');
  }

}
