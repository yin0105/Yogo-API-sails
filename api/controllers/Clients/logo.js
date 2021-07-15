const qs = require('qs')

module.exports = async (req, res) => {

  /**
   * This action is public
   */

  const client = await Client.findOne({id: req.params.id})

  if (!client) return res.badRequest('Invalid client')

  if (!client.logo) {
    return res.ok('')
  }

  const url = await sails.helpers.images.url.with({
    image: client.logo,
    width: parseInt(req.query.w || 200),
    height: parseInt(req.query.h || 200),
  })

  return res.redirect(302, url)

}
