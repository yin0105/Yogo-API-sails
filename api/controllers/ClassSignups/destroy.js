module.exports = async function (req, res) {

  const can = await sails.helpers.can2('controller.ClassSignups.destroy', req)
    .tolerate('classHasStarted', () => {
      res.ok('E_CLASS_HAS_STARTED')
      return null
    })

  if (can === null) return
  if (can === false) return res.forbidden()

  const userGetsRefundAfterDeadline = req.authorizedRequestContext === 'admin'
    || req.authorizedRequestContext === 'teacher';

  await sails.helpers.classSignups.destroy.with({
    signup: req.param('id'),
    userGetsRefundAfterDeadline: userGetsRefundAfterDeadline,
  })

  return res.ok()

}
