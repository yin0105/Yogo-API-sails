module.exports = {

  customer: async req => {
    const order = await Order.findOne(req.body.order)
    return parseInt(order.user) === parseInt(req.user.id)
  }

}
