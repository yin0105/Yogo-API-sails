module.exports = async (req, res) => {

  if (req.query.format) {
    const salaryFileAction = require('./salary-file')
    return await salaryFileAction(req, res)
  }

  if (!await sails.helpers.can(req.user, 'read', 'Order')) {
    return res.forbidden()
  }

  const reportParams = {
    clientId: req.client.id,
    teachers: req.body.teachers || req.query.teachers,
    fromDate: req.body.fromDate || req.query.fromDate,
    endDate: req.body.endDate || req.query.endDate,
  }

  const salaryData = await sails.helpers.reports.salary.with(reportParams)

  return res.json(salaryData)


}
