module.exports = async function (req, res) {

  let query = MembershipType.findOne(req.param('id'))

  const populateFields = _.keyBy(
    _.intersection(
      req.query.populate,
      [
        'payment_options',
        'payment_options.membershipCount',
        'image',
        'class_types',
        'price_groups',
        'memberships',
        'memberships.user',
        'memberships.user.image',
        'memberships.payment_subscriptions',
        'memberships.payment_option',
      ],
    ),
  )

  let simplePopulateFields

  if (req.query.populate) {

    simplePopulateFields = _.keyBy(
      _.intersection(
        req.query.populate,
        ['payment_options', 'image', 'class_types', 'price_groups'],
      ),
    )


    _.each(
      simplePopulateFields,
      field => {
        if (field === 'image' || field === 'payment_options') {
          query.populate(field)
        } else {
          query.populate(field, {archived: false})
        }
      },
    )

  }

  const membershipType = await query

  let complexPopulateFields = _.keyBy(
    _.intersection(
      req.query.populate,
      ['payment_options.membershipCount'],
    ),
  )

  if (simplePopulateFields.payment_options && complexPopulateFields['payment_options.membershipCount'] && membershipType.payment_options.length) {

    const sql = require('../../sql/MembershipTypesControllerSql/getMembershipCountForPaymentOptions.sql')

    const result = await sails.sendNativeQuery(sql, [_.map(membershipType.payment_options, 'id')])
    const membershipCounts = _.keyBy(result.rows, 'id')

    _.each(
      membershipType.payment_options,
      paymentOption => paymentOption.membershipCount = membershipCounts[paymentOption.id].membershipCount,
    )
  }

  if (populateFields.memberships) {
    const membershipsQuery = Membership.find({
      membership_type: membershipType.id,
      archived: false,
      status: ['active', 'cancelled_running', 'renewal_failed'],
    })
    if (populateFields['memberships.payment_subscriptions']) {
      membershipsQuery.populate('payment_subscriptions', {status: 'active'})
    }
    if (populateFields['memberships.user']) {
      membershipsQuery.populate('user')
    }
    if (populateFields['memberships.payment_option']) {
      membershipsQuery.populate('payment_option')
    }
    const memberships = await membershipsQuery
    if (populateFields['memberships.user.image']) {
      const imageIds = _.compact(_.map(memberships, membership => membership.user.image))
      const images = _.keyBy(
        await Image.find({id: imageIds}),
        'id',
      )
      _.each(memberships, membership => {
        if (membership.user.image) {
          membership.user.image = images[membership.user.image]
        }
      })
    }
    membershipType.memberships = memberships

  }

  return res.json(membershipType)

}
