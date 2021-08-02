module.exports = async (req, res) => {

  if (req.query.format) {
    const ordersFileAction = require('./orders-file')
    return await ordersFileAction(req, res)
  }

  if (!await sails.helpers.can(req.user, 'read', 'Order')) {
    return res.forbidden()
  }

  const reportParams = {
    clientId: req.client.id,
    startDate: req.body.startDate || req.query.startDate,
    endDate: req.body.endDate || req.query.endDate,
  }

  const ordersData = await sails.helpers.reports.orders.with(reportParams)

  return res.json(ordersData)


}
