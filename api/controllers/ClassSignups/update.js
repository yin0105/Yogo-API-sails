module.exports = async (req, res) => {

  if (!(await sails.helpers.can2('controller.ClassSignups.update', req))) {
    return res.forbidden()
  }

  const signupId = req.param('id')

  const updateData = _.pick(req.body, [
    'checked_in',
  ])

  const updatedSignup = (await ClassSignup.update(
    {
      id: signupId,
    },
    updateData,
  ).fetch())[0]

  return res.json(updatedSignup)

}
