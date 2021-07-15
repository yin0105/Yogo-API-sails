module.exports = async function (req, res) {

  const can = await sails.helpers.can2('controller.ClassSignups.find', req)
    .tolerate('badRequest', async e => {
      res.badRequest(e.message)
      return null
    })

  if (can === null) return
  if (can === false) return res.forbidden()

  let signups

  if (req.query.user) {

    signups = await sails.helpers.classSignups.findByUser.with({
      user: req.query.user,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    })

  } else if (req.query.class) {

    signups = await ClassSignup.find({
      class: parseInt(req.query.class),
      archived: false,
      cancelled_at: 0,
    })

  } else {
    return res.badRequest('User or class must be specified')
  }

  await sails.helpers.classSignups.populate(signups, req.query.populate)

  return res.json(signups)

}
