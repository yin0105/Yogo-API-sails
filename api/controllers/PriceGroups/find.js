const PriceGroupObj = require('../../objection-models/PriceGroup');

module.exports = {
  friendlyName: 'Find price groups',

  inputs: {
    id: {
      type: 'number',
    },
    populate: {
      type: 'json',
    },
    desiredItem: {
      type: 'string',
    },
  },

  fn: async function (inputs, exits) {

    let priceGroupQuery = PriceGroupObj.query()
      .where({
        client: this.req.client.id,
        archived: false,
      })
      .orderBy('sort');

    if (inputs.id) {
      priceGroupQuery.where('id', inputs.id);
    }

    if (inputs.populate) {
      const eagerConfigObject = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(inputs.populate);
      priceGroupQuery.eager(eagerConfigObject);
    }

    //console.log('inputs.desiredItem:', inputs.desiredItem);
    if (inputs.desiredItem) {
      const matchingPriceGroups = await sails.helpers.priceGroups.getForDesiredItem(inputs.desiredItem);
      priceGroupQuery.andWhere('id', 'in', _.map(matchingPriceGroups, 'id'));
    }

    const priceGroups = await priceGroupQuery;
    return exits.success(inputs.id ? priceGroups[0] : priceGroups);

  },
};
