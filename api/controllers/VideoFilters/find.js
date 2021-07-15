const VideoFilterObj = require('../../objection-models/VideoFilter');

const VALID_EAGER_POPULATE_FIELDS = [
  'filter_values',
  'show_for_main_categories',
];

module.exports = {
  friendlyName: 'Find video filters',

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
  },

  fn: async function (inputs, exits) {

    const query = VideoFilterObj.query()
      .where({
        client_id: this.req.client.id,
        archived: 0,
      })
      .orderBy('sort_idx');

    if (inputs.id) {
      query.where({id: inputs.id})
    }

    if (inputs.populate) {
      const eagerPopulatefields = _.intersection(
        inputs.populate,
        VALID_EAGER_POPULATE_FIELDS,
      );
      query.eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulatefields));
    }

    const videoFilters = await query;

    return exits.success(inputs.id ? videoFilters[0] : videoFilters);

  },

};
