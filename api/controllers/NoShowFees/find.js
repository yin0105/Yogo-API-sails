const NoShowFeeObj = require('../../objection-models/NoShowFee');
const VALID_EAGER_POPULATE_FIELDS = [
  'class',
  'class.class_type',
  'class_signup',
  'class_signup.user',
  'class_signup.used_class_pass',
  'class_signup.used_class_pass.class_pass_type',
  'class_signup.used_membership',
  'class_signup.used_membership.membership_type',
  'user',
  'paid_with_order',
];

const VALID_MANUAL_POPULATE_FIELDS = [
  'fee_text',
];

module.exports = {
  friendlyName: ' Find no-show fees',

  inputs: {
    date: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
      required: true,
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

    if (!await sails.helpers.can2('controller.NoShowFees.find', this.req)) {
      return exits.forbidden();
    }

    const eagerPopulateFields = _.intersection(
      inputs.populate,
      VALID_EAGER_POPULATE_FIELDS,
    );

    const noShowFees = await NoShowFeeObj.query().alias('nsf')
      .innerJoin({c: 'class'}, 'nsf.class_id', 'c.id')
      .where({
        'c.client': this.req.client.id,
        'c.date': inputs.date,
        'c.archived': 0,
        'c.cancelled': 0,
        'nsf.archived': 0,
      })
      .eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields));

    const manualPopulateFields = _.intersection(
      inputs.populate,
      VALID_MANUAL_POPULATE_FIELDS,
    );

    for (let i = 0; i < manualPopulateFields.length; i++) {
      const manualPopulateField = manualPopulateFields[i];
      await sails.helpers.populate.noShowFees[_.camelCase(manualPopulateField)](noShowFees);
    }

    return exits.success(noShowFees);

  },
};
