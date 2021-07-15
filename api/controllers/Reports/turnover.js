module.exports = async (req, res) => {

  if (req.query.format) {
    const turnoverFileAction = require('./turnover-file')
    return await turnoverFileAction(req, res)
  }

  if (!await sails.helpers.can(req.user, 'read', 'Order')) {
    return res.forbidden()
  }

  const reportParams = {
    clientId: req.client.id,
    periodType: req.body.periodType || req.query.periodType,
    startDate: req.body.startDate || req.query.startDate,
    endDate: req.body.endDate || req.query.endDate,
  }

  const turnoverData = await sails.helpers.reports.turnover.with(reportParams)

  return res.json(turnoverData)


}
