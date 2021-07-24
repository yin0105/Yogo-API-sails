/**
 * acl
 *
 * @description :: Policy to check if user can access the requested resource
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

const knex = require('../services/knex');

module.exports = async function (req, res, next) {

  // Payment gateways might return client in POST body. (But is this still relevant after we switched to Reepay?)
  if (req.body && req.body.client && !req.query.client) {
    req.query.client = req.body.client;
  }

  
  if (req.query.client) {
    req.client = await Client.findOne({id: req.query.client, archived: false});

    if (!req.client) {
      return res.badRequest('E_INVALID_CLIENT_ID');
    }

  } else if (req.header('X-Yogo-Client-ID')) {
    req.client = await Client.findOne({id: req.header('X-Yogo-Client-ID'), archived: false});

    if (!req.client) {
      return res.badRequest('E_INVALID_CLIENT_ID');
    }

  } else if (req.query.reportToken) {
    const reportParams = await sails.helpers.reports.unpackReportToken(req.query.reportToken, req);

    if (!reportParams || !reportParams.clientId) return res.badRequest('Invalid reportToken');

    const client = await Client.findOne({id: reportParams.clientId, archived: false});

    if (!client) {
      return res.badRequest('E_INVALID_CLIENT_ID');
    }

    req.client = client;

  } else if (req.get('referrer') && req.get('referrer').indexOf('localhost') === -1) {

    const {1: referrerDomain} = req.get('referrer').match(/:\/\/([\w.-]+)/);

    const clients = await knex({c: 'client'})
      .innerJoin({d: 'domain'}, 'c.id', 'd.client')
      .where({
        'c.archived': 0,
        'd.archived': 0,
        'd.name': referrerDomain,
      })
      .select('c.*');

    if (clients.length > 1) {
      return res.badRequest('Multiple clients with same domain.');
    }
    if (!clients || clients.length === 0) {
      return res.badRequest('E_DOMAIN_NOT_RECOGNIZED');
    }

    req.client = await Client.findOne(clients[0].id);

  } else {

    return res.badRequest('Missing client id');

  }

  const locale = await sails.helpers.clientSettings.find(req.client, 'locale');

  req.setLocale(locale);

  return next();

};
