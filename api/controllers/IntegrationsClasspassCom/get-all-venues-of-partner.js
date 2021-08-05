const moment = require('moment');

module.exports = async (req, res) => {
  const partner_id = req.params.id;
  const page = req.query.page;
  const page_size = req.query.page_size; 
  const venues = await Branch.find({client: partner_id});
  const client = await Client.findOne({id: partner_id});

  console.log(venues);

  const countOfVenues = venues.length;
  
  if (!page) return res.badRequest("Missing query 'page'");
  if (!page_size) return res.badRequest("Missing query 'page_size'");
  if (!client) return res.badRequest("Invalid partner_id");

  let resData = {};
  resData.venues = [];
  resData.pagination = {
    page: page,
    page_size: page_size,
    total_pages: Math.ceil(countOfVenues / page_size)
  };
  
  if (page_size * (page - 1) < countOfVenues) {
    // page number is valid
    const numOfLastVenue = (page_size * page < countOfVenues) ? page_size * page : countOfVenues;
    for (let i = (page_size * (page - 1)); i < numOfLastVenue; i++) {
      let venue = {};
      venue.partner_id = partner_id;
      venue.venue_id = venues[i].id;
      venue.venue_name = venues[i].name;
      venue.address = {
        address_line1: client.address_1,
        address_line2: client.address_2,
        city: client.city,
        zip: client.zip_code,
        country: client.country,
      };
      venue.phone = client.phone;
      venue.email = client.email;
      venue.website = client.website;
      venue.last_updated = moment(venues[i].updatedAt).format();
      resData.venues.push(venue);
    }
  } else {
    // page number is invalid
  }

  return res.json(resData);
}
