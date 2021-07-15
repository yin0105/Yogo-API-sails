module.exports = async (req, res) => {

  await sails.helpers.authorize(req.user, 'destroy', 'Product', req.param('id'))

  await Product.update({id: req.param('id')}, {archived: true})

  return res.ok()

}
