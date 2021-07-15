/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');



/**
 * 401 (Unauthorized) Handler
 *
 * Usage:
 * return res.unauthorized();
 * return res.unauthorized(data);
 *
 * e.g.:
 * ```
 * return res.unauthorized(
 *   'Token invalid'
 * );
 * ```
 */

module.exports = function unauthorized(data) {

  // Get access to `req` and `res`
  var req = this.req;
  var res = this.res;

  // Get access to `sails`
  var sails = req._sails;

  // Log error to console
  if (!_.isUndefined(data)) {
    sails.log.verbose('Sending 401 ("Unauthorized") response: \n', data);
  }

  // Set status code
  res.status(401);

  // If no data was provided, use res.sendStatus().
  if (_.isUndefined(data)) {
    return res.sendStatus(401);
  }

  if (_.isError(data)) {
    // If the data is an Error instance and it doesn't have a custom .toJSON(),
    // then util.inspect() it instead (otherwise res.json() will turn it into an empty dictionary).
    // > Note that we don't do this in production, since (depending on your Node.js version) inspecting
    // > the Error might reveal the `stack`.  And since `res.unauthorized()` could certainly be used in
    // > production, we wouldn't want to inadvertently dump a stack trace.
    if (!_.isFunction(data.toJSON)) {
      if (process.env.NODE_ENV === 'production') {
        return res.sendStatus(401);
      }
      // No need to JSON stringify (this is already a string).
      return res.send(util.inspect(data));
    }
  }
  return res.json(data);

};
