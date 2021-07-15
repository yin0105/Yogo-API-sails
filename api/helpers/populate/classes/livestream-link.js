module.exports = {
  friendlyName: 'Populate Class.livestream_link',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
    user: {
      type: 'json',
      description: 'The current user',
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    // Already populated??
    if (typeof inputs.classes[0].livestream_link !== 'undefined') {
      return exits.success(inputs.classes);
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.livestream_link = false;
      });
      return exits.success(inputs.classes);
    }

    const clientIds = _.map(inputs.classes, cls => sails.helpers.util.idOrObjectIdInteger(cls.client || cls.client_id));
    const clientDomains = await Domain.find({client: clientIds});

    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i];
      const clientDomain = _.find(clientDomains, {client: sails.helpers.util.idOrObjectIdInteger(cls.client || cls.client_id)}).name;
      cls.livestream_link = `https://${clientDomain}/frontend/index.html#/livestream/class/${cls.id}/preloader`;
    }

    return exits.success(inputs.classes);

  },
};
