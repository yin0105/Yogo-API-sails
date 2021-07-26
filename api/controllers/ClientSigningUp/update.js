module.exports = async function (req, res) {

  let clientData = _.pick(req.body, [
    'name',
    'address_1',
    'address_2',
    'zip_code',
    'city',
    'country',
    'vat_number',
    'email',
    'phone',
    'website',
    'sms_sender_name',
    'logo',
    'logo_white'
  ])

  let client = await Client.update({id: req.param('id')}, clientData).fetch()
  let response = await sails.helpers.clientSettings.update(req.param('id'), {"sms_sender_name": req.param("sms_sender_name")})
  let clientSetting = await ClientSettings.update({client: req.param('id')}, {sms_sender_name: req.param('sms_sender_name')}).fetch()

  client = client[0]

  return res.json(client)

}