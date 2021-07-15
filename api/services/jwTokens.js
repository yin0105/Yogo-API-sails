/**
 * jwToken
 *
 * @description :: JSON Webtoken Service for sails
 * @help        :: See https://github.com/auth0/node-jsonwebtoken & http://sailsjs.org/#!/documentation/concepts/Services
 */

const
  jwt = require('jsonwebtoken'),
  tokenSecret = "5mMICCjvTJ9DBKgZgkmZai9U3oEbVUtAbHlai8RLJR4GO9KexISF5s0UCWcyMspHCwRi2W"

// Generates a token from supplied payload
module.exports.issue = function (payload, expiresIn) {
  if (typeof expiresIn === 'undefined') {
    expiresIn = 2590000 // One month
  }
  return jwt.sign(
    payload,
    tokenSecret, // Token Secret that we sign it with
    {
      expiresIn: expiresIn, // Token Expire time: one month
    },
  )
}

// Verifies token on a request
module.exports.verify = function (token, callback) {
  return jwt.verify(
    token, // The token to be verified
    tokenSecret, // Same token we used to sign
    {}, // No Option, for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    callback, //Pass errors or decoded token to callback
  )
}
