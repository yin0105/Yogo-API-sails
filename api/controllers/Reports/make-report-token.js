
module.exports = async (req, res) => {

  if (!req.user || !req.user.admin) {
    return res.forbidden()
  }

  const reportParams = req.body
  reportParams.clientId = req.client.id

  const token = await sails.helpers.reports.makeReportToken.with({
    reportParams: reportParams,
    req: req,
  })

  return res.json({
    token: token,
  })
}
