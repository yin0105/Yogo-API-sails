const jwToken = require('../../services/jwTokens.js');
const {v4: uuidv4} = require('uuid');
const knex = require('../../services/knex');
const create = require("d:/madhav/projects/yogo-api/api/controllers/clients/create")
module.exports = async (req, res) => {

  const sms_sender = req.body

  let eventGroupData = _.pick(req.body, [
    'id',
    'name',
    'address_1',
    'address_2',
    'zip_code',
    'city',
    'country',
    'vat_id',
    'sms_sender_name'
]);

  const client = await Client.update({id:  req.body.id}, eventGroupData).fetch();
  const clientSetting = await ClientSettings.update({id: req.body.id}, {sms_sender_name: req.body.sms_sender_name}).fetch()
  

  return res.json(client)
}
