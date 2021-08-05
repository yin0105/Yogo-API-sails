const moment = require('moment');

module.exports = async (req, res) => {
  const client = await Client.findOne({id: req.params.id});
  let resData = {};
  
  if (client) {
    // client exists
    let partner = {};
    partner.id = client.id;
    partner.name = client.name;
    partner.last_updated = moment(client.updatedAt).format();
    
    resData.partner = partner;
  } else {
    // client doesn't exist
  }

  return res.json(resData);
}
