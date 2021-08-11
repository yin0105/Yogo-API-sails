const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
  const partner_id = req.params.partner_id;
  const venue_id = req.params.venue_id;
  const venue = await Branch.findOne({client: partner_id, id: venue_id});
  const clients = await knex({c: 'client'})
  .leftJoin({i: 'image'}, 'i.id', 'c.logo')
  .select(
    knex.raw("c.name AS name"),
    knex.raw("c.address_1 AS address_1"), 
    knex.raw("c.address_2 AS address_2"),
    knex.raw("c.city AS city"),
    knex.raw("c.zip_code AS zip_code"),
    knex.raw("c.country AS country"),
    knex.raw("c.phone AS phone"),
    knex.raw("c.email AS email"),
    knex.raw("c.website AS website"),
    knex.raw("i.original_width AS width"),
    knex.raw("i.original_height AS height"),
    knex.raw("i.filename AS uri"))
  .where('c.id', partner_id);

  if (clients.length == 0) return res.badRequest("Invalid partner_id");  

  let resData = {};
  resData.venue = {};
  
  if (venue) {
    // venue exists
    resData.venue.partner_id = partner_id;
    resData.venue.venue_id = venue.id.toString();
    resData.venue.venue_name = venue.name;
    resData.venue.address = {
      address_line1: clients[0].address_1,
      address_line2: clients[0].address_2,
      city: clients[0].city,
      zip: clients[0].zip_code,
      country: clients[0].country,
    };
    // resData.venue.phone = clients[0].phone;
    // resData.venue.email = clients[0].email;
    // resData.venue.website = clients[0].website;
    resData.venue.images = [];
    if (clients[0].uri) {
      if (clients[0].width) {
        resData.venue.images.push({
          width: clients[0].width,
          height: clients[0].height,
          url: `${sails.config.imgixServer}/${clients[0].uri}`,
        });
      } else {
        let result = await axios.get(`${sails.config.imgixServer}/${clients[0].uri}?fm=json`)
        resData.venue.images.push({
          width: result.data.PixelWidth,
          height: result.data.PixelHeight,
          url: `${sails.config.imgixServer}/${clients[0].uri}`,
        });
      }
    }

    resData.venue.last_updated = moment(venue.updatedAt).format();
  }

  return res.json(resData);
}
