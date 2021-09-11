const MembershipObjection = require('../../objection-models/Membership');
const VALID_EAGER_POPULATE_FIELDS = [
  'payment_option',
  'membership_type',
  'membership_type.class_types',
  'membership_type.payment_options',
  'payment_subscriptions',
  'payment_subscriptions.payment_subscription_transactions',
  'orders',
  'log_entries',
  'user',
  'membership_campaign',
  'discount_code',
  'pending_no_show_fees',
  'pending_no_show_fees.class',
  'pending_no_show_fees.class.class_type',
  'pending_no_show_fees.class_signup',
  'membership_pauses',
];

const VALID_MANUAL_POPULATE_FIELDS = [
  'next_payment',
  'current_membership_pause',
  'upcoming_membership_pause',
  'earliest_valid_membership_pause_start_date',
  'customer_can_pause_membership',
  'membership_pause_affects_next_payment_date',
  'membership_pause_starts_days_before_next_payment_date',
  'membership_pause_length',
  'cancelled_from_date_including_membership_pause',
  'status_text',
];

module.exports = {
  friendlyName: 'Find memberships',

  inputs: {
    id: {
      type: 'json',
      custom: id => parseInt(id) || _.every(id, parseInt),
    },
    user: {
      type: 'number',
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
    console.log("memberships/find")

    if (!await sails.helpers.can2('controller.Memberships.find', this.req, inputs)) {
      return exits.forbidden()
    }

    const populateFields = _.isObject(inputs.populate) ? _.values(inputs.populate) : inputs.populate;

    const eagerPopulateFields = _.intersection(populateFields, VALID_EAGER_POPULATE_FIELDS);

    let membershipQuery = MembershipObjection.query()
      .where({
        client: this.req.client.id,
        archived: false,
      })
      .eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields))
    ;

    if (this.req.authorizedRequestContext === 'customer') {
      membershipQuery.andWhere('user', this.req.user.id)
    }

    if (inputs.user) {
      membershipQuery.andWhere({user: inputs.user});
    }

    if (inputs.id) {
      membershipQuery.andWhere('id', 'in', _.isArray(inputs.id) ? inputs.id : [inputs.id]);
    }

    let memberships = await membershipQuery;
    console.log("memberships = ", memberships)
    console.log("user = ",inputs.user)

    const manualPopulateFields = _.intersection(
      populateFields,
      VALID_MANUAL_POPULATE_FIELDS,
    );

    for (let i = 0; i < manualPopulateFields.length; i++) {
      const manualPopulateField = manualPopulateFields[i];

      const helperObject = require('../../helpers/populate/memberships/' + _.kebabCase(manualPopulateField));
      const helperRequiresI18n = !!helperObject.inputs.i18n;

      const helper = sails.helpers.populate.memberships[_.camelCase(manualPopulateField)];

      await helper.with({
        memberships,
        i18n: helperRequiresI18n ? this.req.i18n : undefined,
      });
    }

    console.log("inputs.id = ", inputs.id)
    console.log("memberships = ", memberships)

    console.log("return: ", inputs.id && !_.isArray(inputs.id) ? memberships[0] : memberships)
    return exits.success(
      inputs.id && !_.isArray(inputs.id) ? memberships[0] : memberships,
    );

  },
};
