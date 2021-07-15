/**
 * PriceGroupsController
 *
 * @description ::
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  async update(req, res) {

    let priceGroupData = _.pick(req.body, [
      'name',
      'show_in_default_price_list',
    ])

    const updatedPriceGroup = await PriceGroup.update({id: req.param('id')}, priceGroupData).fetch()

    return res.json(updatedPriceGroup)

  },


  async create(req, res) {

    let priceGroupData = _.pick(req.body, [
      'name',
      'show_in_default_price_list',
    ])

    priceGroupData.client = req.client.id
    priceGroupData.sort = 99999

    const newPriceGroup = await PriceGroup.create(priceGroupData).fetch()

    return res.json(newPriceGroup)

  },


  async destroy(req, res) {

    await PriceGroup.update({id: req.param('id')}, {archived: true})

    return res.ok()

  },


  async updateSort(req, res) {

    const priceGroupIds = req.body.sortOrder

    if (!_.isArray(priceGroupIds) || !priceGroupIds.length) {
      return res.badRequest('Invalid input')
    }

    await Promise.all(
      _.map(
        priceGroupIds,
        (id, idx) => PriceGroup.update(
          {
            id: id,
            client: req.client.id,
          },
          {
            sort: idx,
          },
        ),
      ),
    )

    return res.ok()

  },

}

