module.exports = async (req, res) => {

  console.log("keys = ", req.query.keys)
  const settings = await sails.helpers.clientSettings.find.with({
    keys: req.query.keys,
    client: req.client.id,
    includeSecrets: true,
  })
    .tolerate('invalidKey', (e) => {
      return e.raw
    })

  if (settings.error) {
    return res.badRequest(settings.message)
  }

  return res.json(
    settings,
  )

}
