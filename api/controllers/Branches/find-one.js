module.exports = async (req, res) => {

  const branch = await Branch.findOne({id: req.params.id})

  if (req.client.id != branch.client) {
    return res.badRequest('Branch does not belong to this client')
  }

  return res.json(branch)

}
