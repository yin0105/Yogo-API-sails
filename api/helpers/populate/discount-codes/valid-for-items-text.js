module.exports = {
  friendlyName: 'Populate valid_for_items_text',

  inputs: {
    discountCodes: {
      type: 'ref',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.discountCodes.length) {
      return exits.success([])
    }

    if (typeof inputs.discountCodes[0].valid_for_items_text !== 'undefined') {
      return exits.success(inputs.discountCodes)
    }

    let
      allMembershipTypeIds = [],
      allClassPassTypeIds = [],
      allEventIds = [],
      allProductIds = []

    _.each(inputs.discountCodes, discountCode => {
      const validForItems = discountCode.valid_for_items

      const validForMembershipTypeIds = _.chain(validForItems)
        .filter(item => item.match(/^membership_type_\d+$/))
        .map(item => item.substr(16))
        .value()

      allMembershipTypeIds = _.concat(allMembershipTypeIds, validForMembershipTypeIds)

      const validForClassPassTypeIds = _.chain(validForItems)
        .filter(item => item.match(/^class_pass_type_\d+$/))
        .map(item => item.substr(16))
        .value()

      allClassPassTypeIds = _.concat(allClassPassTypeIds, validForClassPassTypeIds)

      const validForEventIds = _.chain(validForItems)
        .filter(item => item.match(/^event_\d+$/))
        .map(item => item.substr(6))
        .value()

      allEventIds = _.concat(allEventIds, validForEventIds)

      const validForProductIds = _.chain(validForItems)
        .filter(item => item.match(/^product_\d+$/))
        .map(item => item.substr(8))
        .value()

      allProductIds = _.concat(allProductIds, validForProductIds)
    })

    allMembershipTypeIds = _.uniq(allMembershipTypeIds)
    allClassPassTypeIds = _.uniq(allClassPassTypeIds)
    allEventIds = _.uniq(allEventIds)
    allProductIds = _.uniq(allProductIds)

    const allMembershipTypes = _.keyBy(
      await MembershipType.find({id: allMembershipTypeIds}),
      'id',
    )

    const allClassPassTypes = _.keyBy(
      await ClassPassType.find({id: allClassPassTypeIds}),
      'id',
    )

    const allEvents = _.keyBy(
      await Event.find({id: allEventIds}),
      'id',
    )

    const allProducts = _.keyBy(
      await Product.find({id: allProductIds}),
      'id',
    )

    _.each(inputs.discountCodes, discountCode => {
      let names = []
      _.each(discountCode.valid_for_items, item => {

        if (item === 'membership_types') {
          names.push('Alle medlemskaber')
          return
        }
        if (item.substr(0, 16) === 'membership_type_') {
          const membershipTypeId = item.substr(16)
          names.push(allMembershipTypes[membershipTypeId].name)
          return
        }

        if (item === 'class_pass_types') {
          names.push('Alle adgangskort')
          return
        }
        if (item.substr(0, 16) === 'class_pass_type_') {
          const classPassTypeId = item.substr(16)
          names.push(allClassPassTypes[classPassTypeId].name)
          return
        }

        if (item === 'events') {
          names.push('Alle kurser')
          return
        }
        if (item.substr(0, 6) === 'event_') {
          const eventId = item.substr(6)
          names.push(allEvents[eventId].name)
          return
        }

        if (item === 'products') {
          names.push('Alle varer')
          return
        }
        if (item.substr(0, 8) === 'product_') {
          const productId = item.substr(8)
          names.push(allProducts[productId].name)
          return
        }
      })

      discountCode.valid_for_items_text = names.join(', ')

    })

    return exits.success(inputs.discountCodes)


  },
}
