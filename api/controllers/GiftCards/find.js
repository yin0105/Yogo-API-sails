const GiftCardObj = require('../../objection-models/GiftCard');

const VALID_EAGER_POPULATE_FIELDS = [
  'sent_by_user',
  'paid_with_order',
  'log_entries'
];

module.exports = {
  friendlyName: 'Find gift cards',

  inputs: {
    id: {
      type: 'number',
    },
    populate: {
      type: 'json',
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    badRequest: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.GiftCards.find', this.req, inputs)) {
      return exits.forbidden();
    }

    const query = GiftCardObj.query()
      .where({
        client_id: this.req.client.id,
        archived: 0,
        activated: 1,
      });

    if (inputs.id) {
      query.andWhere({id: inputs.id});
    }

    if (inputs.populate) {
      const eagerPopulateFields = _.intersection(
        inputs.populate,
        VALID_EAGER_POPULATE_FIELDS,
      );
      query.eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields));
    }

    const results = await query;

    if (inputs.id) {
      return exits.success(results[0]);
    } else {
      return exits.success(results);
    }

  },
};
