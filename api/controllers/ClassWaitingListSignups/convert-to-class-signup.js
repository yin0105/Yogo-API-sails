module.exports = {
  friendlyName: 'Convert class waiting list signup to class signup',

  inputs: {
    id: {
      type: 'number',
      required: true
    }
  },

  exits: {
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function(inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassWaitingListSignups.convert-to-class-signup', this.req)) {
      return exits.forbidden()
    }

    const newClassSignup = await sails.helpers.classWaitingListSignups.convertToClassSignup(inputs.id);

    return exits.success(newClassSignup);

  }
}
