module.exports = async (req, res) => {

  let userRequest = User.findOne(req.param('id'))

  // Filter populate fields
  let populateFields = req.query.populate
    ?
    _.keyBy(_.intersection(req.query.populate, [
      'image',
      'cart_items',
      'cart_items.payment_option',
      'cart_items.membership_campaign',
      'cart_items.product',

      'memberships',
      'memberships.membership_type',
      'memberships.membership_type.class_types',
      'memberships.payment_option',
      'memberships.payment_subscriptions',
      'memberships.real_user_image',
      'memberships.next_payment',

      'class_passes',
      'class_passes.class_pass_type',
      'class_passes.class_pass_type.class_types',

      'event_signups',
      'event_signups.event',

      'class_signups',
      'class_signups.class',
      'class_signups.class.class_type',
      'class_signups.class.teachers',
      'class_signups.class.room',

      'class_signups.used_class_pass',
      'class_signups.used_class_pass.class_pass_type',

      'class_signups.used_membership',

      'video_groups_that_customer_can_access',
      'invoices'
    ]))
    :
    {}

  _.each(
    _.pick(populateFields, ['image']),
    function (field) {
      userRequest.populate(field)
    },
  )

  _.each(
    _.pick(populateFields, ['cart_items', 'class_passes', 'memberships', 'event_signups']),
    function (field) {
      userRequest.populate(field, {archived: false})
    },
  )

  _.each(
    _.pick(populateFields, ['class_signups']),
    function (field) {
      userRequest.populate(field, {archived: false, cancelled_at: 0})
    },
  )

  let user = await userRequest


  // CLASS PASSES
  if (populateFields['class_passes.class_pass_type']) {
    const classPassTypeIds = _.map(user.class_passes, classPass => classPass.class_pass_type)

    const classPassTypeQuery = ClassPassType.find({id: classPassTypeIds})

    if (populateFields['class_passes.class_pass_type.class_types']) {
      classPassTypeQuery.populate('class_types')
    }

    const classPassTypes = _.keyBy(await classPassTypeQuery, 'id')

    _.each(user.class_passes, classPass => {
      classPass.class_pass_type = classPassTypes[classPass.class_pass_type]
    })

  }


  // MEMBERSHIPS
  if (populateFields.memberships) {
    let membershipQuery = Membership.find({
      id: _.map(user.memberships, 'id'),
      archived: false,
    })

    if (populateFields['memberships.payment_option']) membershipQuery.populate('payment_option')
    if (populateFields['memberships.payment_subscriptions']) membershipQuery.populate('payment_subscriptions', {
      archived: false,
    })

    if (populateFields['memberships.real_user_image']) membershipQuery.populate('real_user_image')

    user.memberships = await membershipQuery

    if (populateFields['memberships.membership_type']) {
      const membershipTypeIds = _.map(user.memberships, membership => membership.membership_type)
      const membershipTypeQuery = MembershipType.find({id: membershipTypeIds})
      if (populateFields['memberships.membership_type.class_types']) {
        membershipTypeQuery.populate('class_types')
      }
      const membershipTypes = _.keyBy(await membershipTypeQuery, 'id')

      _.each(user.memberships, membership => {
        membership.membership_type = membershipTypes[membership.membership_type]
      })
    }

    if (populateFields['memberships.next_payment']) {
      await sails.helpers.populate.memberships.nextPayment(user.memberships)
    }

  }

  // CLASS_SIGNUPS
  if (populateFields.class_signups) {
    if (populateFields['class_signups.class']) {
      let classIds = _.map(user.class_signups, 'class')

      let classQuery = Class.find({id: classIds, archived: false})

      if (populateFields['class_signups.class.class_type']) classQuery.populate('class_type')
      if (populateFields['class_signups.class.teachers']) classQuery.populate('teachers')
      if (populateFields['class_signups.class.room']) classQuery.populate('room')

      let classes = await classQuery

      classes = _.keyBy(classes, 'id')

      _.each(user.class_signups, (signup) => {
        signup.class = classes[signup.class]
      })
    }
    if (populateFields['class_signups.used_class_pass']) {
      const usedClassPassIds = _.compact(_.uniq(_.map(user.class_signups, 'used_class_pass')))

      const usedClassPassQuery = ClassPass.find({id: usedClassPassIds})

      if (populateFields['class_signups.used_class_pass.class_pass_type']) {
        usedClassPassQuery.populate('class_pass_type')
      }
      const usedClassPasses = _.keyBy(await usedClassPassQuery, 'id')

      _.each(user.class_signups, classSignup => {
        if (classSignup.used_class_pass) {
          classSignup.used_class_pass = usedClassPasses[classSignup.used_class_pass]
        }
      })
    }

    if (populateFields['class_signups.used_membership']) {
      const usedMembershipIds = _.compact(_.uniq(_.map(user.class_signups, 'used_membership')))

      const usedMembershipQuery = Membership.find({id: usedMembershipIds})

      const usedMemberships = _.keyBy(await usedMembershipQuery, 'id')

      _.each(user.class_signups, classSignup => {
        if (classSignup.used_membership) {
          classSignup.used_membership = usedMemberships[classSignup.used_membership]
        }
      })
    }
  }

  // EVENTS
  user.event_signups = _.filter(user.event_signups, signup => !signup.archived)
  if (populateFields.event_signups && populateFields['event_signups.event']) {
    await Promise.all(user.event_signups.map(async (signup) => {
      signup.event = await Event.findOne(signup.event)
    }))
  }

  // CART ITEMS
  if (populateFields['cart_items.payment_option']) {
    user.cart_items = await CartItem.populatePaymentOption(user.cart_items)
  }
  if (populateFields['cart_items.membership_campaign']) {
    user.cart_items = await CartItem.populateMembershipCampaign(user.cart_items)
  }
  if (populateFields['cart_items.product']) {
    user.cart_items = await CartItem.populateProduct(user.cart_items)
  }

  // VIDEOS
  if (populateFields['video_groups_that_customer_can_access']) {
    await sails.helpers.populate.users.videoGroupsThatCustomerCanAccess([user])
    const videos = _.flatten(_.map(user.video_groups_that_customer_can_access, 'videos'))
    await sails.helpers.populate.videos.videoProviderData(videos)
    await sails.helpers.video.setInformationLevelForUser(videos, req)
  }

  // INVOICES
  if (populateFields.invoices) {
    await sails.helpers.populate.users.invoices([user])
  }

  return res.json(user)
}
