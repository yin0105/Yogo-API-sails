const
  MembershipTypeObjection = require('../../objection-models/MembershipType'),
  VALID_EAGER_POPULATE_FIELDS = [
    'payment_options',
    'image',
    'class_types',
    'class_types_livestream',
    'video_groups',
    'price_groups',
    'active_campaign',
    'memberships',
    'memberships.user',
    'memberships.user.image',
    'memberships.payment_subscriptions',
    'memberships.payment_option',
    'memberships.discount_code',
    'memberships.membership_campaign',
  ],
  VALID_MANUAL_POPULATE_FIELDS = [
    'membershipCount',
    'max_number_of_memberships_reached',
    'payment_options.membershipCount',
    'userIsEligibleForCampaign',
    'payment_options.nameAccountingForCampaign',
    'payment_options.priceTextAccountingForCampaign',
    'payment_options.nameThatUserSees',
    'payment_options.priceTextThatUserSees',
    'memberships.next_payment',
    'memberships.status_text',
    'user_has_membership_type',
    'user_membership_id',
  ]

module.exports = {
  friendlyName: 'MembershipType.find',

  inputs: {
    id: {
      type: 'json',
      description: 'Id or array of ids. Only return membership types with these ids',
      required: false,
    },
    priceGroupName: {
      type: 'string',
      description: 'Only return membership types in this price group',
      required: false,
    },
    populate: {
      type: 'json',
      description: 'An array of field names to populate. Valid fields:\n' + _.concat(VALID_EAGER_POPULATE_FIELDS, VALID_MANUAL_POPULATE_FIELDS).join('\n'),
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    const membershipTypeQuery = MembershipTypeObjection.query()
      .select('mt.*')
      .from({mt: 'membership_type'})
      .where({
        'mt.client': this.req.client.id,
        'mt.archived': false,
      })

    if (inputs.id) {
      if (_.isArray(inputs.id)) {
        membershipTypeQuery.where('mt.id', 'in', inputs.id)
      } else {
        membershipTypeQuery.where('mt.id', inputs.id)
      }
    }


    if (inputs.priceGroupName) {
      membershipTypeQuery
        .innerJoin({mpg_pmt: 'membershiptype_price_groups__pricegroup_membership_types'}, 'mt.id', 'mpg_pmt.membershiptype_price_groups')
        .innerJoin({pg: 'price_group'}, 'mpg_pmt.pricegroup_membership_types', 'pg.id')
        .where('pg.name', inputs.priceGroupName)
    }

    let manualPopulateFields

    if (inputs.populate) {

      const eagerPopulateFields = _.intersection(
        inputs.populate,
        VALID_EAGER_POPULATE_FIELDS,
      )

      if (_.includes(inputs.populate, 'payment_options.membershipCount') && !_.includes(inputs.populate, 'payment_options')) {
        eagerPopulateFields.push('payment_options')
      }

      const eagerConfigObject = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields)

      membershipTypeQuery.eager(eagerConfigObject)
      membershipTypeQuery
        .modifyEager('payment_options', builder => {
          builder.where('archived', false)
        })
        .modifyEager('class_types', builder => {
          builder.where('archived', false)
        })
        .modifyEager('class_types_livestream', builder => {
          builder.where('class_type.archived', false)
        })
        .modifyEager('video_groups', builder => {
          builder.where('archived', false)
        })
        .modifyEager('price_groups', builder => {
          builder.where('archived', false)
        })
        .modifyEager('memberships', builder => {
          builder
            .where('status', 'in', ['active', 'cancelled_running'])
            .andWhere('archived', false)
        })
        .modifyEager('memberships.payment_subscription', builder => {
          builder.where('status', 'active')
        })

    }

    const membershipTypes = await membershipTypeQuery


    manualPopulateFields = _.keyBy(_.intersection(
      inputs.populate,
      VALID_MANUAL_POPULATE_FIELDS,
    ))

    if (manualPopulateFields && manualPopulateFields.membershipCount) {
      await sails.helpers.populate.membershipTypes.membershipCount(membershipTypes)
    }

    if (manualPopulateFields && manualPopulateFields.max_number_of_memberships_reached) {
      await sails.helpers.populate.membershipTypes.maxNumberOfMembershipsReached(membershipTypes)
    }

    if (manualPopulateFields && manualPopulateFields['payment_options.membershipCount']) {
      await sails.helpers.populate.membershipTypePaymentOptions.membershipCount(_.flatten(_.map(membershipTypes, 'payment_options')))
    }

    if (manualPopulateFields && manualPopulateFields.userIsEligibleForCampaign) {
      await sails.helpers.populate.membershipTypes.userIsEligibleForCampaign(membershipTypes, this.req.user)
    }

    if (manualPopulateFields && manualPopulateFields['payment_options.nameAccountingForCampaign']) {
      await sails.helpers.populate.membershipTypePaymentOptions.nameAccountingForCampaign(_.flatten(_.map(membershipTypes, 'payment_options')))
    }


    if (manualPopulateFields && manualPopulateFields['payment_options.priceTextAccountingForCampaign']) {
      await sails.helpers.populate.membershipTypePaymentOptions.priceTextAccountingForCampaign(_.flatten(_.map(membershipTypes, 'payment_options')))
    }

    if (manualPopulateFields && manualPopulateFields['payment_options.nameThatUserSees']) {
      await sails.helpers.populate.membershipTypePaymentOptions.nameThatUserSees(_.flatten(_.map(membershipTypes, 'payment_options')), this.req.user)
    }

    if (manualPopulateFields && manualPopulateFields['payment_options.priceTextThatUserSees']) {
      await sails.helpers.populate.membershipTypePaymentOptions.priceTextThatUserSees(_.flatten(_.map(membershipTypes, 'payment_options')), this.req.user)
    }

    if (manualPopulateFields && manualPopulateFields['memberships.next_payment']) {
      await sails.helpers.populate.memberships.nextPayment(_.flatten(_.map(membershipTypes, 'memberships')))
    }

    if (manualPopulateFields && manualPopulateFields['memberships.status_text']) {
      await sails.helpers.populate.memberships.statusText(_.flatten(_.map(membershipTypes, 'memberships')), this.req.i18n)
    }

    if (manualPopulateFields && manualPopulateFields['user_has_membership_type']) {
      await sails.helpers.populate.membershipTypes.userHasMembershipType(membershipTypes, this.req.user)
    }

    if (manualPopulateFields && manualPopulateFields['user_membership_id']) {
      await sails.helpers.populate.membershipTypes.userMembershipId(membershipTypes, this.req.user)
    }

    return exits.success(membershipTypes)
  },
}
