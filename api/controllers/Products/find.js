const Product = require('../../objection-models/Product')
const findQuery = require('objection-find')

module.exports = async (req, res) => {

  await sails.helpers.authorize(req.user, 'read', 'Product')

  const productQuery = findQuery(Product)
    .allowEager('[image]')
    .build(req.query)
    .where('client', req.client.id)
    .andWhere('archived', false)

  if (!req.user || !req.user.admin || req.requestContext !== 'admin') {

    productQuery.andWhere('for_sale', true)

  }

  const products = await productQuery

  return res.json(products)

}
