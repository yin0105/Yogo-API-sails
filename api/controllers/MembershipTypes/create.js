module.exports = {
  friendlyName: 'Create membership type',

  inputs: {
    name: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      required: false
    },
    image: {
      type: 'number',
      required: false
    },
    class_types: {
      type: 'json',
      description: 'An array of class_type ids',
      required: true,
    },
    class_types_livestream: {
      type: 'json',
      description: 'An array of class_type ids',
      required: true,
    },
    video_groups: {
      type: 'json',
      description: 'An array of video group ids',
      required: true,
    },
    access_all_videos: {
      type: 'boolean',
      defaultsTo: false,
    },
    price_groups: {
      type: 'json',
      description: 'An array of price_group ids',
      required: false
    },
    payment_options: {
      type: 'json',
      description: 'An array of PaymentOption',
      required: true,
      custom: paymentOptions => !!paymentOptions.length
    },
    send_email_to_customer: {
      type: 'boolean',
      required: true
    },
    email_subject: {
      type: 'string',
      required: false
    },
    email_body: {
      type: 'string',
      required: false
    },
    has_max_number_of_memberships: {
      type: 'boolean',
      required: true
    },
    max_number_of_memberships: {
      type :'number',
      required: false
    },
    has_max_number_of_classes_per_week: {
      type: 'boolean',
      required: false
    },
    max_number_of_classes_per_week: {
      type: 'number',
      required: false
    },
    has_max_number_of_simultaneous_bookings : {
      type: 'boolean',
      required: false
    },
    max_number_of_simultaneous_bookings: {
      type: 'number',
      required: false
    },
    active_campaign: {
      type: 'json',
      descirption: 'A MembershipCampaign object',
      required: false
    }
  },
  fn: async function (inputs, exits) {

    const membershipTypeData = _.cloneDeep(_.pick(inputs, [
      'name',
      'description',
      'image',
      'class_types',
      'class_types_livestream',
      'video_groups',
      'access_all_videos',
      'price_groups',
      'payment_options',
      'active_campaign',
      'for_sale',
      'send_email_to_customer',
      'email_subject',
      'email_body',
      'has_max_number_of_memberships',
      'max_number_of_memberships',
      'has_max_number_of_classes_per_week',
      'max_number_of_classes_per_week',
      'has_max_number_of_simultaneous_bookings',
      'max_number_of_simultaneous_bookings'
    ]))

    membershipTypeData.client = this.req.client.id

    if (membershipTypeData.access_all_videos === null) {
      membershipTypeData.access_all_videos = false;
    }

    if (membershipTypeData.image) {
      await Image.update({id: membershipTypeData.image}, {expires: 0})
    }

    _.each(membershipTypeData.payment_options, paymentOption => paymentOption.client = this.req.client.id)

    const paymentOptions = await MembershipTypePaymentOption.createEach(membershipTypeData.payment_options).fetch()
    membershipTypeData.payment_options = _.map(paymentOptions, 'id')

    if (membershipTypeData.active_campaign) {
      const activeCampaign = await MembershipCampaign.create(membershipTypeData.active_campaign).fetch()
      membershipTypeData.active_campaign = activeCampaign.id
    }

    if (membershipTypeData.price_groups === null) {
      delete membershipTypeData.price_groups
    }

    const newMembershipType = await MembershipType.create(membershipTypeData)

    return exits.success(newMembershipType)

  }

}
