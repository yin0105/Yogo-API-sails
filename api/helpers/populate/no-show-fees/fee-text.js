const currencyDkk = require('../../../filters/currency_dkk')

module.exports = {
  friendlyName: 'Populate no-show fee text (short description)',

  inputs: {
    noShowFees: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.noShowFees.length) {
      return exits.success([]);
    }

    // Already populated??
    if (typeof inputs.noShowFees[0].fee_text !== 'undefined') {
      return exits.success(inputs.noShowFees);
    }

    _.each(inputs.noShowFees, noShowFee => {
        if (noShowFee.amount) {
          noShowFee.fee_text = currencyDkk(noShowFee.amount) + ' kr';
        } else if (noShowFee.days_deducted) {

          if (parseInt(noShowFee.days_deducted) === 1) {
            noShowFee.fee_text = sails.helpers.t('noShowFeeText.OneDayDeducted');
          } else {
            noShowFee.fee_text = sails.helpers.t('noShowFeeText.daysDeducted', [noShowFee.days_deducted]);
          }

        } else if (noShowFee.classes_spent) {
          noShowFee.fee_text = sails.helpers.t('noShowFeeText.classPassClassSpent');
        }
      },
    );

    return exits.success();

  },
};
