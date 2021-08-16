module.exports = async (req, res) => {

  const branches = await Branch.find({client: req.client.id, archived: false}).sort('sort ASC').sort('id ASC')

  return res.json(branches)

}
