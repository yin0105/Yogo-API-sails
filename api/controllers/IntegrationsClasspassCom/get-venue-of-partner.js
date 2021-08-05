const moment = require('moment');

module.exports = async (req, res) => {
  const partner_id = req.params.partner_id;
  const venue_id = req.params.venue_id;
  const venue = await Branch.findOne({client: partner_id, id: venue_id});
  const client = await Client.findOne({id: partner_id});

  if (!client) return res.badRequest("Invalid partner_id");

  let resData = {};
  resData.venue = {};
  
  if (venue) {
    // venue exists
    resData.venue.partner_id = partner_id;
    resData.venue.venue_id = venue.id;
    resData.venue.venue_name = venue.name;
    resData.venue.address = {
      address_line1: client.address_1,
      address_line2: client.address_2,
      city: client.city,
      zip: client.zip_code,
      country: client.country,
    };
    resData.venue.phone = client.phone;
    resData.venue.email = client.email;
    resData.venue.website = client.website;
    resData.venue.last_updated = moment(venue.updatedAt).format();
  }

  return res.json(resData);
}
