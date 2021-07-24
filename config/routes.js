/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {


  'GET /': 'PingController.ping',
  'GET /ping': 'PingController.ping',

  'POST /login': 'AuthController.login',
  'POST /login-to-checkin': 'AuthController.login-to-checkin',
  'POST /logout': 'AuthController.logout',
  'GET /check-token': 'AuthController.check-token',
  'GET /get-login-status': 'AuthController.get-login-status',
  'POST /password-reset-send-token': 'AuthController.password-reset-send-token',
  'POST /password-reset-check-token': 'AuthController.password-reset-check-token',
  'POST /password-reset-set-password-with-token': 'AuthController.password-reset-set-password-with-token',


  'GET /branches': 'BranchesController.find',
  'GET /branches/:id': 'BranchesController.find-one',
  'PUT /branches/:id': 'BranchesController.update',
  'PUT /branches/sort': 'BranchesController.update-sort',

  'GET /cart-items': 'CartItemsController.find',
  'POST /cart-items': 'CartItemsController.create',
  'DELETE /cart-items/:id': 'CartItemsController.destroy',

  'GET /class-emails': 'ClassEmails.find',
  'GET /class-emails/:id': 'ClassEmails.find',
  'POST /class-emails': 'ClassEmails.create',
  'PUT /class-emails/:id': 'ClassEmails.update',
  'DELETE /class-emails/:id': 'ClassEmails.destroy',

  'GET /class-signups': 'ClassSignupsController.find',
  'POST /class-signups': 'ClassSignupsController.create',
  'PUT /class-signups/:id': 'ClassSignupsController.update',
  'DELETE /class-signups/:id': 'ClassSignupsController.destroy',

  'GET /class-type-emails': 'ClassTypeEmails.find',
  'GET /class-type-emails/:id': 'ClassTypeEmails.find',
  'POST /class-type-emails': 'ClassTypeEmails.create',
  'PUT /class-type-emails/:id': 'ClassTypeEmails.update',
  'DELETE /class-type-emails/:id': 'ClassTypeEmails.destroy',

  'GET /class-waiting-list-signups': 'ClassWaitingListSignupsController.find',
  'POST /class-waiting-list-signups': 'ClassWaitingListSignupsController.create',
  'DELETE /class-waiting-list-signups/:id': 'ClassWaitingListSignupsController.destroy',
  'POST /class-waiting-list-signups/:id/convert-to-class-signup': 'ClassWaitingListSignupsController.convert-to-class-signup',

  'GET /class-livestream-signups': 'ClassLivestreamSignupsController.find',
  'POST /class-livestream-signups': 'ClassLivestreamSignupsController.create',
  'DELETE /class-livestream-signups/:id': 'ClassLivestreamSignupsController.destroy',

  'GET /class-types': 'ClassTypesController.find',
  'GET /class-types/:id': 'ClassTypesController.find',
  'POST /class-types': 'ClassTypesController.create',
  'PUT /class-types/:id': 'ClassTypesController.update',
  'DELETE /class-types/:id': 'ClassTypesController.destroy',

  'GET /class-pass-types': 'ClassPassTypesController.find',
  'GET /class-pass-types/:id': 'ClassPassTypesController.find-one',
  'POST /class-pass-types': 'ClassPassTypesController.create',
  'PUT /class-pass-types/:id': 'ClassPassTypesController.update',
  'DELETE /class-pass-types/:id': 'ClassPassTypesController.destroy',

  'GET /class-passes': 'ClassPassesController.find',
  'GET /class-passes/:id': 'ClassPassesController.find',
  'POST /class-passes': 'ClassPassesController.create',
  'PUT /class-passes/:id': 'ClassPassesController.update',
  'DELETE /class-passes/:id': 'ClassPassesController.destroy',

  'GET /classes': 'ClassesController.find',
  'GET /classes/:id': 'ClassesController.find-one',
  'GET /classes/:id/ics': 'ClassesController.ics-file',
  'GET /classes/ical-feed/teacher/:teacherId': 'ClassesController.ical-feed-teacher',
  'POST /classes': 'ClassesController.create',
  'PUT /classes/:id': 'ClassesController.update',
  'PUT /classes/:id/cancel': 'ClassesController.cancel',
  'DELETE /classes/:id': 'ClassesController.destroy',

  'GET /clients/current': 'ClientsController.find-current',
  'GET /clients/:id': 'ClientsController.find-one',
  'PUT /clients/:id': 'ClientsController.update',
  'GET /clients/:id/settings': 'ClientsController.get-settings',
  'PUT /clients/:id/settings': 'ClientsController.update-settings',
  'GET /clients/:id/logo': 'ClientsController.logo',
  'PUT /clients/:id/create': 'ClientsController.create',

  'POST /cron/tick': 'CronController.tick',
  'POST /cron/log': 'CronController.log',
  'POST /cron/cancel-class-waiting-lists': 'CronController.cancel-class-waiting-lists',
  'POST /cron/send-livestream-notification-emails': 'CronController.send-livestream-notification-emails',
  'POST /cron/auto-send-class-emails': 'CronController.auto-send-class-emails',
  'POST /cron/send-class-type-notification-emails': 'CronController.send-class-type-notification-emails',
  'POST /cron/apply-no-show-fees': 'CronController.apply-no-show-fees',

  'GET /discount-codes': 'DiscountCodesController.find',
  'POST /discount-codes': 'DiscountCodesController.create',
  'PUT /discount-codes/:id': 'DiscountCodesController.update',
  'DELETE /discount-codes/:id': 'DiscountCodesController.destroy',

  'GET /events': 'EventsController.find',
  'GET /events/:id': 'EventsController.find-one',
  'POST /events': 'EventsController.create',
  'PUT /events/:id': 'EventsController.update',
  'DELETE /events/:id': 'EventsController.destroy',

  'GET /event-groups': 'EventGroupsController.find',
  'GET /event-groups/:id': 'EventGroupsController.findOne',
  'POST /event-groups': 'EventGroupsController.create',
  'PUT /event-groups/:id': 'EventGroupsController.update',
  'PUT /event-groups/sort': 'EventGroupsController.updateSort',
  'DELETE /event-groups/:id': 'EventGroupsController.destroy',

  'GET /event-signups': 'EventSignupsController.find',
  'POST /event-signups': 'EventSignupsController.create',
  'DELETE /event-signups/:id': 'EventSignupsController.destroy',

  'GET /event-time-slots': 'EventTimeSlotsController.find',

  'GET /export/client': 'ExportController.client',

  'GET /gift-cards': 'GiftCardsController.find',
  'GET /gift-cards/:id': 'GiftCardsController.find',
  'POST /gift-cards': 'GiftCardsController.create',
  'PUT /gift-cards/:id': 'GiftCardsController.update',
  'DELETE /gift-cards/:id': 'GiftCardsController.destroy',
  'POST /gift-cards/:id/register-as-sent': 'GiftCardsController.register-as-sent',
  'POST /gift-cards/:id/register-as-not-sent': 'GiftCardsController.register-as-not-sent',

  'GET /images/:id': 'ImagesController.findOne',
  'POST /images': 'ImagesController.create',

  'POST /import/customers': 'ImportController.customers',
  'POST /import/reset-import': 'ImportController.reset-import',
  'POST /import/welcome-customer-reset-password': 'ImportController.welcome-customer-reset-password',

  'POST /integrations/cometchat/init-class-livestream-chat': 'IntegrationsCometChat.init-class-livestream-chat',

  'GET /integrations/vimeo/status': 'IntegrationsVimeo.status',
  'GET /integrations/vimeo/auth/callback': 'IntegrationsVimeo.auth-callback',
  'POST /integrations/vimeo/update-video-data-from-vimeo': 'IntegrationsVimeo.update-video-data-from-vimeo',

  'POST /livestream/get-register-client-for-class-auth-token': 'Livestream.get-register-client-for-class-auth-token',
  'POST /livestream/webhook': 'Livestream.webhook',
  'GET /livestream/liveswitch-info': 'Livestream.liveswitch-info',

  'POST /membership-pauses': 'MembershipPausesController.create',
  'PUT /membership-pauses/:id': 'MembershipPausesController.update',
  'DELETE /membership-pauses/:id': 'MembershipPausesController.destroy',

  'GET /membership-types': 'MembershipTypesController.find',
  'GET /membership-types/:id': 'MembershipTypesController.find-one',
  'POST /membership-types': 'MembershipTypesController.create',
  'PUT /membership-types/:id': 'MembershipTypesController.update',
  'DELETE /membership-types/:id': 'MembershipTypesController.destroy',

  'GET /memberships': 'MembershipsController.find',
  'GET /memberships/:id': 'MembershipsController.findOne',
  'POST /memberships': 'MembershipsController.create',
  'PUT /memberships/:id': 'MembershipsController.update',
  'DELETE /memberships/:id': 'MembershipsController.destroy',
  'POST /memberships/:id/retry-failed-subscription-payment': 'MembershipsController.retryFailedSubscriptionPayment',

  'GET /no-show-fees': "NoShowFeesController.find",
  'POST /no-show-fees/:id/cancel': "NoShowFeesController.cancel",
  'POST /no-show-fees/:id/reactivate': "NoShowFeesController.reactivate",

  'GET /orders': 'OrdersController.find',
  'GET /orders/:id': 'OrdersController.find',
  'GET /orders/:id/pdf-receipt': 'OrdersController.pdfReceipt',

  'POST /payments/dibs/preauth-start-ticket-accepted': 'DibsPaymentsController.preauthStartTicketAccepted',
  'POST /payments/dibs/preauth-start-ticket-cancelled': 'DibsPaymentsController.preauthStartTicketCancelled',
  'POST /payments/dibs/accepted': 'DibsPaymentsController.paymentAccepted',
  'POST /payments/dibs/cancelled': 'DibsPaymentsController.paymentCancelled',

  'POST /payments/dibs/preauth-change-membership-credit-card-accepted': 'DibsPaymentsController.preauthChangeMembershipCreditCardAccepted',
  'POST /payments/dibs/preauth-change-membership-credit-card-cancelled': 'DibsPaymentsController.preauthChangeMembershipCreditCardCancelled',

  'POST /payments/reepay/create-order-and-charge-session': 'ReepayPaymentsController.create-order-and-charge-session',
  'POST /payments/reepay/create-order-and-matching-session-type': 'ReepayPaymentsController.create-order-and-matching-session-type',
  'POST /payments/reepay/create-recurring-session': 'ReepayPaymentsController.create-recurring-session',
  'POST /payments/reepay/create-order-and-charge-session-for-gift-card': 'GiftCardsController.create-order-and-charge-session',
  'POST /payments/reepay/invoice/:invoiceId/process-if-paid': 'ReepayPaymentsController.process-invoice-if-invoice-is-paid',
  'POST /payments/reepay/settle-and-attach-card-to-zero-total-recurring-order': 'ReepayPaymentsController.settle-and-attach-card-to-zero-total-recurring-order',
  'POST /payments/reepay/attach-card-to-membership': 'ReepayPaymentsController.attach-card-to-membership',
  'POST /payments/reepay/webhook': 'ReepayPaymentsController.webhook',


  'GET /price-groups': 'PriceGroupsController.find',
  'GET /price-groups/:id': 'PriceGroupsController.find',
  'POST /price-groups': 'PriceGroupsController.create',
  'PUT /price-groups/:id': 'PriceGroupsController.update',
  'PUT /price-groups/sort': 'PriceGroupsController.updateSort',
  'DELETE /price-groups/:id': 'PriceGroupsController.destroy',

  'GET /products': 'ProductsController.find',
  'GET /products/:id': 'ProductsController.find-one',
  'POST /products': 'ProductsController.create',
  'PUT /products/:id': 'ProductsController.update',
  'DELETE /products/:id': 'ProductsController.destroy',

  'GET /reports/customers': 'ReportsController.customers',
  'POST /reports/customers': 'ReportsController.customers',
  'POST /reports/make-report-token': 'ReportsController.make-report-token',
  'POST /reports/turnover': 'ReportsController.turnover',
  'GET /reports/turnover': 'ReportsController.turnover',
  'POST /reports/salary': 'ReportsController.salary',
  'GET /reports/salary': 'ReportsController.Salary',
  'POST /reports/livestream': 'ReportsController.livestream',
  'GET /reports/livestream': 'ReportsController.livestream',
  'GET /reports/livestream/class/:id': 'ReportsController.livestream-single-class',

  'GET /rooms': 'RoomsController.find',
  'GET /rooms/:id': 'RoomsController.findOne',
  'POST /rooms': 'RoomsController.create',
  'PUT /rooms/:id': 'RoomsController.update',
  'DELETE /rooms/:id': 'RoomsController.destroy',

  'POST /sms/gateway-api/webhook': 'SmsController.gateway-api-webhook',

  'GET /users': 'UsersController.find',
  'GET /users/:id': 'UsersController.find-one',
  'POST /users': 'UsersController.create',
  'PUT /users/:id': 'UsersController.update',
  'DELETE /users/:id': 'UsersController.destroy',
  'GET /users/:id/history': 'UsersController.history',

  'POST /user-video-favorites/:user': 'UsersController.create-favorite-video',
  'DELETE /user-video-favorites/:user/:video': 'UsersController.destroy-favorite-video',

  'GET /user-devices': 'UserDevicesController.find',


  'GET /video-filters': 'VideoFilters.find',
  'GET /video-filters/:id': 'VideoFilters.find',
  'POST /video-filters': 'VideoFilters.create',
  'PUT /video-filters/:id': 'VideoFilters.update',
  'PUT /video-filters/sort': 'VideoFilters.update-sort',
  'DELETE /video-filters/:id': 'VideoFilters.destroy',

  'GET /video-groups': 'VideoGroups.find',
  'GET /video-groups/:id': 'VideoGroups.find',
  'POST /video-groups': 'VideoGroups.create',
  'PUT /video-groups/:id': 'VideoGroups.update',
  'DELETE /video-groups/:id': 'VideoGroups.destroy',

  'GET /video-main-categories': 'VideoMainCategories.find',


  'GET /videos': 'Videos.find',
  'GET /videos/:id': 'Videos.find',
  'PUT /videos/:id': 'Videos.update',
  'POST /videos/:id/restrict-to-yogo': 'Videos.restrict-to-yogo',
  'POST /videos/:id/unrestrict-from-yogo': 'Videos.unrestrict-from-yogo',

  'POST /webhooks/mailgun': 'Webhooks.mailgun',

};
