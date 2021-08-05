const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
  const page = req.query.page;
  const page_size = req.query.page_size; 
  const clients = await knex({c: 'client'})
  .leftJoin({i: 'image'}, 'i.id', 'c.logo')
  .select(
      knex.raw("c.id AS id"), 
      knex.raw("c.name AS name"),
      knex.raw("c.updatedAt AS updatedAt"),
      knex.raw("i.original_width AS width"),
      knex.raw("i.original_height AS height"),
      knex.raw("i.filename AS uri"));
  const countOfClients = clients.length;
  
  if (!page) return res.badRequest("Missing query 'page'");
  if (!page_size) return res.badRequest("Missing query 'page_size'");

  let resData = {};
  resData.partners = [];
  resData.pagination = {
    page: page,
    page_size: page_size,
    total_pages: Math.ceil(countOfClients / page_size)
  };
  
  if (page_size * (page - 1) < countOfClients) {
    // page number is valid
    const numOfLastClient = (page_size * page < countOfClients) ? page_size * page : countOfClients;
    for (let i = (page_size * (page - 1)); i < numOfLastClient; i++) {
      let partner = {};
      partner.id = clients[i].id;
      partner.name = clients[i].name;
      partner.last_updated = moment(clients[i].updatedAt).format();
      
      partner.images = [];
      if (clients[i].uri) {
        if (clients[i].width) {
          partner.images.push({
            width: clients[i].width,
            height: clients[i].height,
            url: `${sails.config.imgixServer}/${clients[i].uri}`,
          });
        } else {
          let result = await axios.get(`${sails.config.imgixServer}/${clients[i].uri}?fm=json`)
          partner.images.push({
            width: result.data.PixelWidth,
            height: result.data.PixelHeight,
            url: `${sails.config.imgixServer}/${clients[i].uri}`,
          });
        }
      }

      resData.partners.push(partner);
    }
  } else {
    // page number is invalid
  }

  return res.json(resData);
}
