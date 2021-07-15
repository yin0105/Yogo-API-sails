module.exports = async (req, res) => {

  const can = await sails.helpers.can2('controller.CartItems.destroy', req)
    .tolerate('cartItemDoesNotExist', async () => {
      res.ok('E_CART_ITEM_DOES_NOT_EXIST')
      return null
    })

  if (can === null) return
  if (can === false) return res.forbidden()

  await CartItem.destroy({id: req.params.id});

  return res.ok();

}
