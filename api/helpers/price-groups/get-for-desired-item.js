
module.exports = {
  friendlyName: 'Get price groups for desired object',

  inputs: {
    desiredObject: {
      type: 'string',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const desiredObjectType = inputs.desiredObject.split('_').slice(0, -1).join('_');
    const desiredObjectId = inputs.desiredObject.split('_').pop();

    switch (desiredObjectType) {
      case 'video':
        return exits.success(
          sails.helpers.priceGroups.getForAccessToVideo(desiredObjectId)
        );
    }

  },

};
