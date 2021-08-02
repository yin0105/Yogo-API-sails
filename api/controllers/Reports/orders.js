module.exports = async (req, res) => {

  if (req.query.format) {
    console.log("exist format");
    const ordersFileAction = require('./orders-file')
    return await ordersFileAction(req, res)
  }

  if (!await sails.helpers.can(req.user, 'read', 'Order')) {
    console.log("forbidden");
    return res.forbidden()
  }

  const reportParams = {
    clientId: req.client.id,
    startDate: req.body.startDate || req.query.startDate,
    endDate: req.body.endDate || req.query.endDate,
  }

  console.log("reportParams");
  const ordersData = await sails.helpers.reports.orders.with(reportParams)

  return res.json(ordersData)


}
