module.exports = async (req, res) => {


  const client = _.clone(req.client)

  const populateFields = _.isArray(req.query.populate) ?
    _.keyBy(
      _.intersection(
        req.query.populate,
        [
          'logo',
          'logo_white',
          'settings',
          'branches',
        ],
      ),
    )
    :
    {}

  if (
    req.query.populate && req.client.logo &&
    (req.query.populate === 'logo' || populateFields.logo)
  ) {
    client.logo = await Image.findOne(req.client.logo)
  }

  if (populateFields.logo_white && req.client.logo_white) {

    client.logo_white = await Image.findOne(req.client.logo_white)

  }

  if (populateFields.settings) {

    client.settings = await sails.helpers.clientSettings.findAll.with({
      client: req.client.id,
    })

  }

  if (populateFields.branches) {

    client.branches = await Branch.find({
      client: req.client.id,
      archived: 0,
    }).sort('sort ASC')

  }

  return res.json(client)


}
