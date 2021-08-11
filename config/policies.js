/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


 module.exports.policies = {

  // - Always check for client. There is always a client context.
  // - Check for valid token. Ok if not.
  // - Look up user and get roles for active client. Ok if none.
  // - Check if user is allowed to do what she requests

  PingController: {
    '*': [],
  }, // Health check

  CronController: {
    'tick': [],
    'cancel-class-waiting-lists': [],
    'send-livestream-notification-emails': [],
    'auto-send-class-emails': [],
    'send-class-type-notification-emails': [],
    'apply-no-show-fees': [],
    'attendance': [],
  },

  WebhooksController: {
    '*': [],
  },

  LivestreamController: {
    'webhook': [],
  },

  ReepayPaymentsController: {
    'webhook': [],
  },

  IntegrationsVimeoController: {
    'auth-callback': [],
    'update-video-data-from-vimeo': [],
  },

  IntegrationsClasspassComController: {
    'get-all-partners': ['cpAccessToken'],
    'get-partner': ['cpAccessToken'],
    'get-all-venues-of-partner': ['cpAccessToken'],
    'get-venue-of-partner': ['cpAccessToken'],
    'get-upcoming-schedules': ['cpAccessToken'],
    'reservations': ['cpAccessToken'],
    'cancel-reservation': ['cpAccessToken'],
    'attendance': ['cpAccessToken'], //'cpAccessToken'
  },

  SmsController: {
    'gateway-api-webhook': [],
  },

  OrdersController: {
    'pdfReceipt': [],
  },

  ClientsController: {
    'logo': [],
    'find-one': [],
    'update-settings': [],
    'create': [],
    'update': [],
    'find-all':[],
  },

  ClientSigningUpController: {
    'create': [],
    'confirm': [],
  },

  AuthController: {
    'get-login-status': ['getClient', 'setLocale', 'authorize', 'identify', 'requestContext', 'errorFormat', 'logMobileAppRequest'],
    'logout': ['getClient', 'setLocale', 'authorize', 'identify', 'requestContext', 'errorFormat', 'logMobileAppRequest'],
    '*': ['getClient', 'setLocale', 'requestContext', 'errorFormat', 'logMobileAppRequest'],
  },

  UserDevicesController: {
    '*': [],
  },

  '*': ['getClient', 'setLocale', 'authorize', 'identify', 'requestContext', 'errorFormat', 'logMobileAppRequest', 'acl'],

};
