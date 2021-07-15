/**
 * OrdersController
 *
 * @description :: TODO
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


const moment = require('moment-timezone')
moment.locale('da')

module.exports = {

  pdfReceipt: async (req, res) => {

    let order = await Order.findOne(req.param('id')).populate('client').populate('user').populate('order_items')

    if (order.receipt_token !== req.query.receiptToken) {
      return res.badRequest('Receipt token is incorrect')
    }

    const {pdfBuffer, filename} = await sails.helpers.order.pdfReceipt(order)


    res.attachment(filename)
    return res.end(pdfBuffer, 'UTF-8')

  },

}
