module.exports = async (req, res) => {

  await sails.helpers.authorize(req.user, 'read', 'Product', req.param('id'))

  const populateFields =
    req.query.populate ?
      _.keyBy(_.intersection(
        req.query.populate,
        [
          'image',
        ],
      )) :
      []

  const productQuery = Product.findOne(req.param('id'))

  if (populateFields.image) productQuery.populate('image')

  const product = await productQuery

  if (product.archived) {
    return res.notFound()
  }

  if (
    !product.for_sale && (
      !req.user || !req.user.admin
    )
  ) {
    return res.notFound()
  }

  return res.json(product)

}
