module.exports = async (req, res) => {

  if (req.query.format) {
    const classesFileAction = require('./classes-file')
    return await classesFileAction(req, res)
  }

  if (!await sails.helpers.can(req.user, 'read', 'Order')) {
    return res.forbidden()
  }

  const reportParams = {
    clientId: req.client.id,
    teachers: req.body.teachers || req.query.teachers,
    classTypes: req.body.classTypes || req.query.classTypes,
    // allTeachers: req.body.allTeachers || req.query.allTeachers,
    allClassTypes: req.body.allClassTypes || req.query.allClassTypes,
    fromDate: req.body.fromDate || req.query.fromDate,
    endDate: req.body.endDate || req.query.endDate,
    onlyPhysicalAttendance: req.body.onlyPhysicalAttendance || req.query.onlyPhysicalAttendance,
    onlyLivestream: req.body.onlyLivestream || req.query.onlyLivestream,
    onlyClassPassEnabled: req.body.onlyClassPassEnabled || req.query.onlyClassPassEnabled,
  }

  const classesData = await sails.helpers.reports.classes.with(reportParams)

  return res.json(classesData)


}
