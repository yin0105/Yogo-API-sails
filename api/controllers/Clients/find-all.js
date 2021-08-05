module.exports = async (req, res) => {

  const clients = await Client.find()

  return res.json(clients)


}
