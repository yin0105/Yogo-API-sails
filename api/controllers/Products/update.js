module.exports = async (req, res) => {

  await sails.helpers.authorize(req.user, 'update', 'Product', req.param('id'))

  const productData = _.pick(
    req.body,
    [
      'name',
      'image',
      'price',
      'for_sale',
    ],
  )

  const currentProduct = await Product.findOne(req.param('id'))

  if (currentProduct && currentProduct.image && currentProduct.image !== productData.image) {
    await Image.update({id: currentProduct.image}, {expires: 1})
  }

  const updatedProduct = await Product.update({
      id: req.param('id'),
    },
    productData,
  ).fetch()


  if (productData.image) {
    await Image.update({id: productData.image}, {expires: 0})
  }

  return res.json(updatedProduct)

}
