module.exports = {
  friendlyName: 'Destroy video filter',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoFilters.destroy', this.req, inputs))) {
      return exits.forbidden();
    }

    await VideoFilter.destroy({id: inputs.id});

    await sails.helpers.videoFilter.destroyValues(inputs.id);

    return exits.success();

  },

};
