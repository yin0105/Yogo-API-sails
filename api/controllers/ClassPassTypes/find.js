const knex = require('../../services/knex')

const MANUAL_POPULATE_FIELDS = [
  'max_number_per_customer_already_used',
  'user_can_buy',
]

module.exports = {

  friendlyName: 'ClassPassType.find',

  inputs: {
    id: {
      type: 'json',
      description: 'Id or array of ids. Only return membership types with these ids',
      required: false,
    },
    priceGroupName: {
      type: 'string',
      required: false,
    },
    populate: {
      type: 'json',
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    let queryParameters = {client: this.req.client.id, archived: false}

    if (inputs.id) {
      queryParameters.id = inputs.id
    }

    if (inputs.priceGroupName) {
      const priceGroups = await PriceGroup.find({
        client: this.req.client.id,
        name: inputs.priceGroupName,
        archived: false,
      })

      if (priceGroups && priceGroups.length) {
        const priceGroupIds = _.map(priceGroups, 'id')

        const classPassTypesInRequestedPriceGroup = await knex({cpt: 'class_pass_type'})
          .select('cpt.id')
          .innerJoin({join_tbl: 'classpasstype_price_groups__pricegroup_class_pass_types'}, 'join_tbl.classpasstype_price_groups', 'cpt.id')
          .where('join_tbl.pricegroup_class_pass_types', 'in', priceGroupIds)
          .andWhere('cpt.archived', false)

        queryParameters.id = _.map(classPassTypesInRequestedPriceGroup, 'id')
      }
    }

    let query = ClassPassType.find(queryParameters)

    _.each(['image', 'class_types', 'class_types_livestream', 'video_groups', 'price_groups'], populateField => {
      if (inputs.populate && _.includes(inputs.populate, populateField)) {

        if (populateField === 'image') {
          query.populate(populateField)
        } else {
          query.populate(populateField, {archived: false})
        }

      }
    })

    const classPassTypes = await query.sort('id ASC')

    const manualPopulateFields = _.intersection(
      inputs.populate,
      MANUAL_POPULATE_FIELDS,
    )

    for (let i = 0; i < manualPopulateFields.length; i++) {
      const populateFunctionName = _.camelCase(manualPopulateFields[i])
      await sails.helpers.populate.classPassTypes[populateFunctionName](classPassTypes, this.req.user)
    }

    return exits.success(classPassTypes)

  },

}
