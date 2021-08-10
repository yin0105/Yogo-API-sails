const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
  const clients = await knex({c: 'client'})
  .leftJoin({i: 'image'}, 'i.id', 'c.logo')
  .select(
      knex.raw("c.id AS id"), 
      knex.raw("c.name AS name"),
      knex.raw("c.updatedAt AS updatedAt"),
      knex.raw("i.original_width AS width"),
      knex.raw("i.original_height AS height"),
      knex.raw("i.filename AS uri"))
  .where("c.id", req.params.id);

  let resData = {};
  let partner = {};
  
  if (clients.length > 0) {
    // client exists    
    partner.partner_id = clients[0].id.toString();
    partner.partner_name = clients[0].name;
    partner.last_updated = moment(clients[0].updatedAt).format();
    partner.images = [];
      if (clients[0].uri) {
        if (clients[0].width) {
          partner.images.push({
            width: clients[0].width,
            height: clients[0].height,
            url: `${sails.config.imgixServer}/${clients[0].uri}`,
          });
        } else {
          result = await axios.get(`${sails.config.imgixServer}/${clients[0].uri}?fm=json`)
          partner.images.push({
            width: result.data.PixelWidth,
            height: result.data.PixelHeight,
            url: `${sails.config.imgixServer}/${clients[0].uri}`,
          });
        }
      }

  } else {
    // client doesn't exist
  }

  resData.partner = partner;

  return res.json(resData);
}
