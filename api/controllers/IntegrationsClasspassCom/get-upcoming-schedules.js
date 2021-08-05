const moment = require('moment');
const knex = require('../../services/knex')

module.exports = async (req, res) => {
  const partner_id = req.params.partner_id;
  const venue_id = req.params.venue_id;
  const page = req.query.page;
  const page_size = req.query.page_size; 
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  
  if (!page) return res.badRequest("Missing query 'page'");
  if (!page_size) return res.badRequest("Missing query 'page_size'");
  if (!start_date) return res.badRequest("Missing query 'start_date'");
  if (!end_date) return res.badRequest("Missing query 'end_date'");
  if (!client) return res.badRequest("Invalid partner_id"); 

  const client = await Client.findOne({id: partner_id});
  if (!client) return res.badRequest("Invalid partner_id");

  const venue = await Branch.findOne({client: partner_id, id: venue_id});
  if (!venue) return res.badRequest("Invalid venue_id");
/*
SELECT class.id AS schedule_id, CONCAT(class.date, 'T', class.`start_time`) AS start_datetime, CONCAT(class.date, 'T', class.`end_time`) AS end_datetime, class_type.id AS class_type_id,
 class_type.name AS class_type_name, class_type.description AS class_type_desc, class_type.updatedAt AS class_type_last_updated, room.id AS room_id, room.name AS room_name, 
 room.updatedAt AS room_last_updated, class.seats AS total_spots,   
 
 FROM ((class LEFT JOIN room ON class.room=room.id) 
 LEFT JOIN branch ON room.branch=branch.id) 
 LEFT JOIN class_type ON class.class_type=class_type.id 
 WHERE 
 class.client=1 AND branch.id=1 AND DATE BETWEEN '2021-06-01' AND '2022-01-01'
*/
  const schedules = await knex({c: 'class'})
  .leftJoin({r: 'room'}, 'r.id', 'c.room')
  .leftJoin({b: 'branch'}, 'b.id', 'r.branch')
  .leftJoin({ct: 'class_type'}, 'ct.id', 'c.class_type')
  .innerJoin({oi: 'order_item'}, 'o.id', 'oi.order')
  .select(
      knex.raw('CAST(DATE_ADD("1970-01-01", INTERVAL o.paid/1000 SECOND) AS DATE) AS dd'), 
      knex.raw('DATE_ADD("1970-01-01", INTERVAL FLOOR(o.paid/1000) SECOND) AS paid'), 
      knex.raw('o.invoice_id AS invoice_id'),
      knex.raw('o.user AS user_id'),
      knex.raw('o.non_user_name AS non_user_name'),
      knex.raw('o.non_user_email AS non_user_email'),
      knex.raw('CONCAT(u.first_name, u.last_name) AS user_name'), 
      knex.raw('u.email AS user_email'),
      knex.raw('oi.name AS item_name'),
      knex.raw('oi.item_type AS item_type'),
      knex.raw('oi.item_id AS item_id'),
      knex.raw('oi.count AS item_count'),
      knex.raw('oi.item_price AS item_price'),
      knex.raw('oi.total_price AS item_total_price'),
      knex.raw('oi.vat_amount AS item_vat_amount'),
      knex.raw('o.payment_service_provider AS payment_service_provider'),
      knex.raw('o.pay_type AS pay_type'),
      knex.raw('o.masked_card AS masked_card'),
      knex.raw('o.total AS total'))
  .where("o.invoice_id", ">", 0)
  .andWhereRaw('CAST(DATE_ADD("1970-01-01", INTERVAL o.updatedAt/1000 SECOND) AS DATE) >= ?', [startDate])
  .andWhereRaw('CAST(DATE_ADD("1970-01-01", INTERVAL o.updatedAt/1000 SECOND) AS DATE) <=?', [endDate])
  .andWhere("o.client", client)        
  .orderBy('o.paid', 'o.invoice_id');

queryParameters.id = _.map(classPassTypesInRequestedPriceGroup, 'id')




  console.log(venues);
  
  
  console.log(venues.length, venues);
  if (venues.length == 0) {
    let fakeVenue = {};
    fakeVenue.id = `client_${partner_id}_default_branch`;
    fakeVenue.name = client.name;
    fakeVenue.updatedAt = client.updatedAt;
    venues.push(fakeVenue);
  }

  const countOfVenues = venues.length;
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
