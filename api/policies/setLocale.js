/**
 * setLocale
 *
 * @description :: Policy to set the locale for returned texts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = async (req, res, next) => {


  if (req.client) {

    const {locale} = await sails.helpers.clientSettings.find(req.client.id, ['locale'])

    sails.yogo = sails.yogo || {}
    sails.yogo.locale = locale
  }

  return next()


}
