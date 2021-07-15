const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Calculate payment date with membership pause',

  inputs: {
    membership: {
      type: 'ref',
      required: true,
    },
    start_date: {
      type: 'string',
      required: true,
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
    end_date: {
      type :'string',
      allowNull: true,
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
  },

  fn: async (inputs, exits) => {

    const membership = await sails.helpers.util.objectFromObjectOrObjectId(inputs.membership, Membership);

    const membershipPaymentDate = moment(membership.paid_until).add(1, 'day').format('YYYY-MM-DD');

    if (inputs.start_date > membershipPaymentDate) {
      return exits.success(membershipPaymentDate);
    }
    if (!inputs.end_date) return exits.success(null);

    const membershipPauseLength = moment(inputs.end_date).diff(moment(inputs.start_date), 'days');

    const newPaymentDate = moment(membershipPaymentDate).add(membershipPauseLength, 'day').format('YYYY-MM-DD');
    return exits.success(newPaymentDate);

  }
}
