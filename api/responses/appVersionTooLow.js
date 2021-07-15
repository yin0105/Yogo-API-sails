module.exports = function appVersionTooLow() {

  // Get access to `req` and `res`
  var req = this.req;
  var res = this.res;

  // Get access to `sails`
  var sails = req._sails;

  // Log error to console
  sails.log.verbose('Sending 470 "App version too low" with localized text.');

  // Set status code
  res.status(470);

  // Send localized message saying that the app needs to be updated.
  return res.send(sails.helpers.t('app.appVersionTooLowMessage'));

};
