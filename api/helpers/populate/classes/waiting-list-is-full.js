module.exports = {
  friendlyName: 'Populate Class.waiting_list_is_full',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    // Already populated??
    if (typeof inputs.classes[0].waiting_list_is_full !== 'undefined') {
      return exits.success(inputs.classes);
    }

    // We need Class.signup_count
    await sails.helpers.populate.classes.waitingListCount(inputs.classes);
    await sails.helpers.populate.classes.waitingListMax(inputs.classes);

    _.each(inputs.classes, cls => {

      const seats = parseInt(cls.seats);

      if (seats === 0) {
        cls.waiting_list_is_full = false;
      } else {
        cls.waiting_list_is_full = cls.waiting_list_count >= cls.waiting_list_max;
      }

    });

    return exits.success(inputs.classes);

  },
};
