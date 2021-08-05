const moment = require('moment');

module.exports = async (req, res) => {
  const client = await Client.findOne({id: req.params.id});
  let resData = {};
  let partner = {};
  
  if (client) {
    // client exists    
    partner.id = client.id;
    partner.name = client.name;
    partner.last_updated = moment(client.updatedAt).format();

  } else {
    // client doesn't exist
  }

  resData.partner = partner;

  return res.json(resData);
}
