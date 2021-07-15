module.exports = {
  friendlyName: 'Update membership type',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: false,
    },
    image: {
      type: 'number',
      required: false,
      allowNull: true,
    },
    class_types: {
      type: 'json',
      description: 'An array of class_type ids',
    },
    class_types_livestream: {
      type: 'json',
      description: 'An array of class_type_livestream ids',
    },
    video_groups: {
      type: 'json',
      description: 'An array of video group ids',
    },
    access_all_videos: {
      type: 'boolean',
    },
    price_groups: {
      type: 'json',
      description: 'An array of price_group ids',
    },
    payment_options: {
      type: 'json',
      description: 'An array of PaymentOption',
      required: true,
    },
    send_email_to_customer: {
      type: 'boolean',
      required: true,
    },
    email_subject: {
      type: 'string',
      required: false,
    },
    email_body: {
      type: 'string',
      required: false,
    },
    has_max_number_of_memberships: {
      type: 'boolean',
      required: true,
    },
    max_number_of_memberships: {
      type: 'number',
      required: false,
    },
    has_max_number_of_classes_per_week: {
      type: 'boolean',
      required: false,
    },
    max_number_of_classes_per_week: {
      type: 'number',
      required: false,
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
      description: 'A MembershipCampaign object',
      required: false,
    },
  },

  exits: {
    cannotChangeNumberOfMonthsOnPaymentOptionThatHasMemberships: {
      responseType: 'badRequest',
    },
    cannotDeletePaymentOptionThatHasMemberships: {
      responseType: 'badRequest',
    },
    cannotHaveMoreThanOnePaymentOptionForSaleWithSameNumberOfMonths: {
      responseType: 'badRequest',
    },
    cannotHaveActiveCampaignWithoutPaymentOptionForOneMonth: {
      responseType: 'badRequest'
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

    const currentMembershipType = await MembershipType
      .findOne(this.req.param('id'))
      .populate('payment_options', {archived: false})
      .populate('active_campaign')

    await sails.helpers.populate.membershipTypePaymentOptions.membershipCount(currentMembershipType.payment_options)

    if (currentMembershipType.image && currentMembershipType.image !== membershipTypeData.image) {
      await Image.update({id: currentMembershipType.image}, {expires: 1})
    }

    if (typeof membershipTypeData.image === 'undefined') {
      membershipTypeData.image = null
    }

    // Check validity of payment options
    const numberOfMonthsWithDuplicatePaymentOptionsForSale = _(membershipTypeData.payment_options)
      .groupBy(po => (po.for_sale ? 'for_sale_' : '') + po.number_of_months_payment_covers)
      .pickBy((poGroup, key) => poGroup.length > 1 && key.substr(0, 9) === 'for_sale_')
      .keys()
      .filter(poGroup => poGroup.substr(9))
      .value()

    if (Object.keys(numberOfMonthsWithDuplicatePaymentOptionsForSale).length) {
      return exits.cannotHaveMoreThanOnePaymentOptionForSaleWithSameNumberOfMonths('You can not have more than one payment option for sale for ' + numberOfMonthsWithDuplicatePaymentOptionsForSale[0].substring(9) + ' months.')
    }

    const paymentOptionForSaleForOneMonth = _.find(membershipTypeData.payment_options, po => po.for_sale && parseInt(po.number_of_months_payment_covers) === 1)
    if (membershipTypeData.active_campaign && !paymentOptionForSaleForOneMonth) {
      return exits.cannotHaveActiveCampaignWithoutPaymentOptionForOneMonth('You can not have an active campaign without a payment option for one month.')
    }


    // Insert new payment options
    const newPaymentOptions = _(membershipTypeData.payment_options)
      .filter(paymentOption => !paymentOption.id)
      .map(paymentOption => _.assign(paymentOption, {
        client: this.req.client.id,
        membership_type: this.req.param('id'),
      }))
      .value()

    await MembershipTypePaymentOption.createEach(newPaymentOptions)


    // Update existing payment options
    const updatingPaymentOptions = _.filter(membershipTypeData.payment_options, 'id')

    const updatingPaymentOptionsWithDifferentNumberOfMonthsAndMemberships = _.filter(
      updatingPaymentOptions,
      po => {
        const existingPaymentOption = _.find(currentMembershipType.payment_options, {id: po.id})

        return parseInt(po.number_of_months_payment_covers) !== parseInt(existingPaymentOption.number_of_months_payment_covers) &&
          existingPaymentOption.membershipCount
      },
    )

    if (updatingPaymentOptionsWithDifferentNumberOfMonthsAndMemberships.length) {
      return exits.cannotChangeNumberOfMonthsOnPaymentOptionThatHasMemberships(
        'Cannot change number of months that payment covers for payment option id ' +
        updatingPaymentOptionsWithDifferentNumberOfMonthsAndMemberships[0].id +
        ' because there are active memberships with that payment option.',
      )
    }

    await Promise.all(_.map(updatingPaymentOptions, async paymentOption => {
      await MembershipTypePaymentOption.update(
        {id: paymentOption.id},
        _.pick(
          paymentOption,
          [
            'name',
            'number_of_months_payment_covers',
            'payment_amount',
            'for_sale',
          ],
        ),
      )
    }))


    // Archive missing payment options, but only if they have no active memberships
    const paymentOptionsToArchive = _.differenceBy(
      currentMembershipType.payment_options,
      membershipTypeData.payment_options,
      'id',
    )
    const paymentOptionThatCanNotBeArchivedBecauseOfExistingMemberships = _.find(
      paymentOptionsToArchive,
      'membershipCount',
    )
    if (paymentOptionThatCanNotBeArchivedBecauseOfExistingMemberships) {
      return exits.cannotDeletePaymentOptionThatHasMemberships(
        'Cannot delete payment option with id ' + paymentOptionThatCanNotBeArchivedBecauseOfExistingMemberships.id + ' because there are active memberships with that payment option.',
      )
    }

    await MembershipTypePaymentOption.update({id: _.map(paymentOptionsToArchive, 'id')}, {archived: true})

    // Payment options created above. Don't insert.
    delete membershipTypeData.payment_options

    //
    // Handle payment options END
    //


    //
    // Handle campaign START
    //

    if (membershipTypeData.active_campaign) {
      const membershipCampaign = _(membershipTypeData.active_campaign)
        .pick(
          [
            'number_of_months_at_reduced_price',
            'reduced_price',
            'min_number_of_months_since_customer_last_had_membership_type',
            'name',
          ],
        )
        .assign({client: this.req.client.id})
        .value()

      const existingMatchingCampaign = await MembershipCampaign.findOne(
        membershipCampaign,
      )

      if (existingMatchingCampaign) {
        membershipTypeData.active_campaign = existingMatchingCampaign.id
      } else {
        const newMembershipCampaign = await MembershipCampaign.create(membershipCampaign).fetch()
        membershipTypeData.active_campaign = newMembershipCampaign.id
      }
    }


    //
    // Handle campaign END
    //


    await MembershipType.update({id: this.req.param('id')}, membershipTypeData)

    if (membershipTypeData.image) {
      await Image.update({id: membershipTypeData.image}, {expires: 0})
    }

    const updatedMembershipType = await MembershipType
      .findOne(this.req.param('id'))
      .populate('payment_options', {archived: false})
      .populate('active_campaign')
      .populate('class_types')

    return exits.success(updatedMembershipType)

  },

}
