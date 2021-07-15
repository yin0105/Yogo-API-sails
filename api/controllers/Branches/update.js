module.exports = async (req, res) => {

  if (!req.user.admin) {
    return res.forbidden()
  }

  const existingBranch = await Branch.findOne(req.param('id'))

  if (req.client.id != existingBranch.client) {
    return res.forbidden()
  }

  const branchData = _.pick(req.body, [
    'name',
  ])

  const updatedBranches = await Branch.update({id: req.param('id')}, branchData).fetch()

  const updatedBranch = updatedBranches[0]

  return res.json(updatedBranch)

}
