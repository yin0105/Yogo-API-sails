/**
 * MembershipType.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment')

module.exports = {

  tableName: 'membership_type',

  attributes: {

    client: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    description: {
      type: 'string',
      columnType: 'text',
    },

    image: {
      model: 'Image',
    },

    class_types: {
      collection: 'ClassType',
      via: 'membership_types',
    },

    has_max_number_of_classes_per_week: {
      type: 'boolean',
      defaultsTo: false
    },

    max_number_of_classes_per_week: {
      type: 'number',
      defaultsTo: 2
    },

    has_max_number_of_simultaneous_bookings: {
      type: 'boolean',
      defaultsTo: false
    },

    max_number_of_simultaneous_bookings: {
      type: 'number',
      defaultsTo: 10
    },

    payment_options: {
      collection: 'MembershipTypePaymentOption',
      via: 'membership_type',
    },

    for_sale: 'boolean',

    price_groups: {
      collection: 'PriceGroup',
      via: 'membership_types',
    },

    send_email_to_customer: {
      type: 'boolean',
      defaultsTo: false,
    },

    email_subject: 'string',

    email_body: {
      type: 'string',
      columnType: 'text',
    },

    has_max_number_of_memberships: {
      type: 'boolean',
      defaultsTo: false,
    },

    max_number_of_memberships: 'number',

    memberships: {
      collection: 'Membership',
      via: 'membership_type',
    },

    active_campaign: {
      model: 'MembershipCampaign'
    },

    video_groups: {
      collection: 'VideoGroup',
      via: 'membership_types'
    },

    class_types_livestream: {
      collection: 'ClassType',
      via: 'membership_type',
      through: 'MembershipTypeClassTypeLivestream'
    },

    access_all_videos: {
      type: 'boolean',
      defaultsTo: false
    }

  },

  async applyToCustomer(membershipTypeId, paymentOptionId, userId, orderId, paidUntil, realUserIsSomeoneElse, realUserName, realUserImage, membershipCampaign, membershipCampaignNumberOfReducedPaymentsLeft, discountCodeId) {


    let user = await User.findOne(userId)

    if (!user) throw new Error('applyToCustomer: User not found')

    const paymentOption = await MembershipTypePaymentOption.findOne({
      id: paymentOptionId,
      membership_type: membershipTypeId,
    })
    if (!paymentOption) throw new Error('applyToCustomer: PaymentOption not found')


    // If paid_until is not specified, use paymentOption duration to set it
    if (!paidUntil) {
      paidUntil = moment().startOf('day')
      paidUntil.add(paymentOption.number_of_months_payment_covers, 'months')
    }

    const membership = await Membership.create({
      client: user.client,
      user: user.id,
      order: orderId,
      membership_type: membershipTypeId,
      payment_option: paymentOptionId,
      start_date: moment().format('YYYY-MM-DD'),
      paid_until: paidUntil.format('YYYY-MM-DD'),
      status: 'active',
      membership_campaign: membershipCampaign,
      membership_campaign_number_of_reduced_payments_left: membershipCampaign ? membershipCampaignNumberOfReducedPaymentsLeft : 0,
      discount_code: discountCodeId
    }).fetch()


    if (!membership) throw new Error('Could not create membership')

    const membershipType = await MembershipType.findOne(membershipTypeId)

    if (membershipType.send_email_to_customer) {
      await sails.helpers.email.customer.yourNewMembership(membership)
    }

    return membership

  },

  /*async validate(membershipType) {
    membershipType = _.pick(membershipType, [
      'name',
      'description',
      'image',
      'class_types',
      'price_groups',
      'payment_options',
      'for_sale',
      'send_email_to_customer',
      'email_subject',
      'email_body',
      'has_max_number_of_memberships',
      'max_number_of_memberships',
      'has_max_number_of_classes_per_week',
      'max_number_of_classes_per_week'
    ])


    membershipType.name = membershipType.name.substr(0, 50)

    if (!membershipType.name) {
      throw new ValidationError({message: 'E_FIELD_MISSING', field: 'name'})
    }

    if (!membershipType.class_types || !membershipType.class_types.length) {
      throw new ValidationError({message: 'E_FIELD_MISSING', field: 'class_types'})
    }


    if (!membershipType.payment_options || !membershipType.payment_options.length) {
      throw new ValidationError({message: 'E_FIELD_MISSING', field: 'payment_options'})
    }



    _.each(membershipType.payment_options, (paymentOption, idx) => {
      if (!paymentOption.name) {
        throw new ValidationError({message: 'E_FIELD_MISSING', field: 'payment_options[' + idx + '].name'})
      }
      if (!paymentOption.number_of_months_payment_covers) {
        throw new ValidationError({
          message: 'E_FIELD_MISSING',
          field: 'payment_options[' + idx + '].number_of_months_payment_covers',
        })
      }

      if (!validator.matches(paymentOption.number_of_months_payment_covers.toString(), /^\d+$/)) {
        throw new ValidationError({
          message: 'E_FIELD_INVALID',
          field: 'payment_options[' + idx + '].number_of_months_payment_covers',
        })
      }

      if (!paymentOption.payment_amount) {
        throw new ValidationError({
          message: 'E_FIELD_MISSING',
          field: 'payment_options[' + idx + '].payment_amount',
        })
      }
      if (!validator.matches(paymentOption.payment_amount.toString(), /^\d+$/)) {
        throw new ValidationError({
          message: 'E_FIELD_INVALID',
          field: 'payment_options[' + idx + '].payment_amount',
        })
      }

    })

    // There can not be more options with same number of months
    let monthOptions = _.map(membershipType.payment_options, 'number_of_months_payment_covers')
    monthOptions = _.compact(monthOptions)
    if (monthOptions.length !== membershipType.payment_options.length) {
      if (!validator.matches(paymentOption.payment_amount.toString(), /^\d+$/)) {
        throw new ValidationError({
          message: 'E_FIELD_INVALID',
          field: 'payment_options',
          description: 'There can not be more options with same number of months',
        })
      }
    }

    // Sort by number of months
    membershipType.payment_options = _.sortBy(membershipType.payment_options, 'number_of_months_payment_covers')


    // If image does not exist, remove reference
    let image
    if (membershipType.image) {
      image = await Image.findOne(membershipType.image)
      if (!image) delete membershipType.image
    }

    return membershipType

  },*/
}

