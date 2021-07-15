module.exports = async (req, res) => {

  await sails.helpers.authorize(req.user, 'create', 'Product')

  const productData = _.pick(
    req.body,
    [
      'name',
      'image',
      'price',
      'for_sale',
    ],
  )


  productData.client = req.client.id

  if (productData.image) {
    await Image.update({id: productData.image}, {expires: 0})
  }

  const newProduct = await Product.create(productData).fetch()

  return res.json(newProduct)

}
