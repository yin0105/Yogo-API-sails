const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
    const partner_id = req.body.partner_id;

    console.log("partner_id =",partner_id );

    const client = await knex({c: 'client'})
      .leftJoin({i: 'image'}, 'i.id', 'c.logo')
      .select(
        knex.raw("c.name AS name"), 
        knex.raw("c.updatedAt AS last_updated"),
        knex.raw("i.original_width AS width"),
        knex.raw("i.original_height AS height"),
        knex.raw("i.filename AS uri"))
      .where("c.id", partner_id)
    
    if (client.length) {
      
      let images = [];
      if (client[0].uri) {
        if (client[0].width) {
          images.push({
            "width": client[0].width,
            "height": client[0].height,
            "url": `${sails.config.imgixServer}/${client[0].uri}`,
          });
          
        } else {
          const result = await axios.get(`${sails.config.imgixServer}/${client[0].uri}?fm=json`).catch(error => {console.log(error)})
          images.push({
            "width": result.data.PixelWidth,
            "height": result.data.PixelHeight,
            "url": `${sails.config.imgixServer}/${client[0].uri}`,
          });
        }
      } 

      const partner = {
        "partner_id": partner_id,
        "partner_name": client[0].name,
        "images": images,
        "last_updated": moment(client[0].last_updated).format()
      };

      console.log("partner = ", partner)
      console.log("last update = ", client[0].last_updated);

      const resp = await sails.helpers.integrations.classpass.registerPartner.with({
          partner:  partner,

        })

      if (resp.error) {
          return res.error(resp);
      }

      if (!resp) return
      return res.json(resp)

    }
}
