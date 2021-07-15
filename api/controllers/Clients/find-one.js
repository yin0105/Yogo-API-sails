module.exports = async (req, res) => {

  const client = await Client.findOne({id: req.params.id})

  return res.json(client)


}
