module.exports = {
  friendlyName: 'Populate Class.livestream_url',

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
    if (typeof inputs.classes[0].livestream_url !== 'undefined') {
      return exits.success(inputs.classes);
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.livestream_url = false;
      });
      return exits.success(inputs.classes);
    }

    await sails.helpers.populate.classes.livestreamLink(inputs.classes, inputs.user)

    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i];
      cls.livestream_url = cls.livestream_link;
    }

    return exits.success(inputs.classes);

  },
};
