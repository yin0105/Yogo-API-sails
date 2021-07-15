/**
 * Log mobile app requests
 *
 * @description :: Policy to log meta data sent from app.
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

const compareVersions = require('compare-versions');

module.exports = function (req, res, next) {

  if (req.header('X-Yogo-App-Version')) {

    const appInfo = {
      build: req.header('X-Yogo-App-Build'),
    };

    appInfo.id = req.header('X-Yogo-App-Id');

    appInfo.version = req.header('X-Yogo-App-Version');

    appInfo.client = req.client ? req.client.id : null;

    appInfo.user = req.user ? req.user.id : null;

    appInfo.action = req.options && req.options.action ? req.options.action : null;

    const logger = sails.helpers.logger('mobile-app-requests')
    logger.info('App info: ', appInfo);

    if (compareVersions.compare(req.header('X-Yogo-App-Version'), '1.0.0', '<')) {
      logger.info('App version too low. Aborting.')
      return res.appVersionTooLow();
    }

  }

  return next();

};
