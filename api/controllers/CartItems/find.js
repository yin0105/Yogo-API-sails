module.exports = async (req, res) => {

  if (!await sails.helpers.can2('controller.CartItems.find', req)) {
    return res.forbidden()
  }

  let populateFields = req.query.populate ? _.keyBy(_.intersection(
    req.query.populate,
    [
      'product',
      'payment_option',
      'membership_campaign'
    ]))
    :
    []

  let cartItemQuery = CartItem.find({user: req.query.user});

  if (populateFields.payment_option) {
    cartItemQuery.populate('payment_option')
  }

  let cartItems = await cartItemQuery

  // TODO: _.each(cartItems, cartItem => { if (CartItem.validate(cartItem), etc....

  if (populateFields.product) {
    cartItems = await CartItem.populateProduct(cartItems)
  }

  return res.json(cartItems)

}
