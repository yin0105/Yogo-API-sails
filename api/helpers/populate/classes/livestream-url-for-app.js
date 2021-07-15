module.exports = {
  friendlyName: 'Populate Class.livestream_url_for_app',

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
    if (typeof inputs.classes[0].livestream_url_for_app !== 'undefined') {
      return exits.success(inputs.classes);
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.livestream_url_for_app = false;
      });
      return exits.success(inputs.classes);
    }

    const clientIds = _.map(inputs.classes, cls => sails.helpers.util.idOrObjectIdInteger(cls.client || cls.client_id));
    const clientDomains = await Domain.find({client: clientIds});

    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i];
      const clientDomain = _.find(clientDomains, {client: sails.helpers.util.idOrObjectIdInteger(cls.client || cls.client_id)}).name;
      cls.livestream_url_for_app = `https://${clientDomain}/frontend/index.html?mobileAppMode=1#/livestream/class/${cls.id}/preloader`;
    }

    return exits.success(inputs.classes);

  },
};
