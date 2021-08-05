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

  const client = await Client.findOne({id: partner_id});
  if (!client) return res.badRequest("Invalid partner_id");

  const venue = await Branch.findOne({client: partner_id, id: venue_id});
  if (!venue) return res.badRequest("Invalid venue_id");
/*
SELECT , , , ,
 , , , , , 
 , ,   
 
 FROM ((class LEFT JOIN room ON class.room=room.id) 
 LEFT JOIN branch ON room.branch=branch.id) 
 LEFT JOIN class_type ON class.class_type=class_type.id 
 WHERE 
 c.client=1 AND b.id=1 AND DATE BETWEEN '2021-06-01' AND '2022-01-01'
*/
  const schedules = await knex({c: 'class'})
  .leftJoin({r: 'room'}, 'r.id', 'c.room')
  .leftJoin({b: 'branch'}, 'b.id', 'r.branch')
  .leftJoin({ct: 'class_type'}, 'ct.id', 'c.class_type')
  .select(
      knex.raw("c.id AS schedule_id"), 
      knex.raw("CONCAT(c.date, 'T', c.`start_time`) AS start_datetime"),
      knex.raw("CONCAT(c.date, 'T', c.`end_time`) AS end_datetime"),
      knex.raw("ct.id AS class_type_id"),
      knex.raw("ct.name AS class_type_name"),
      knex.raw("ct.description AS class_type_description"),
      knex.raw("ct.updatedAt AS class_type_last_updated"),
      knex.raw("r.id AS room_id"),
      knex.raw("r.name AS room_name"),
      knex.raw("r.updatedAt AS room_last_updated"),
      knex.raw("c.seats AS total_spots"))
  .where("c.client", partner_id)
  .andWhere("b.id", venue_id)
  .andWhereRaw("DATE BETWEEN ? AND ?", [start_date, end_date])
  .orderBy('c.id');

  console.log(schedules);
  
  const countOfSchedules = schedules.length;
  let resData = {};
  resData.schedules = [];
  resData.pagination = {
    page: page,
    page_size: page_size,
    total_pages: Math.ceil(countOfSchedules / page_size)
  };

  if (page_size * (page - 1) < countOfSchedules) {
    // page number is valid
    const numOfLastSchedule = (page_size * page < countOfSchedules) ? page_size * page : countOfSchedules;
    for (let i = (page_size * (page - 1)); i < numOfLastSchedule; i++) {
      let schedule = {};
      schedule.id = schedules[i].schedule_id;
      schedule.partner_id = partner_id;
      schedule.venue_id = venue_id;
      schedule.start_datetime = schedules[i].start_datetime;
      schedule.end_datetime = schedules[i].end_datetime;
      schedule.class = {
        id: schedules[i].class_type_id,
        name: schedules[i].class_type_name,
        description: schedules[i].class_type_description,
        last_updated: schedules[i].class_type_last_updated,
      };
      schedule.room = {
        id: schedules[i].room_id,
        name: schedules[i].room_name,
        last_updated: schedules[i].room_last_updated,
      };
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;
      schedule.id = schedules[i].id;

      schedule.partner_id = partner_id;
      schedule.venue_id = venues[i].id;
      schedule.venue_name = venues[i].name;
      schedule.address = {
        address_line1: client.address_1,
        address_line2: client.address_2,
        city: client.city,
        zip: client.zip_code,
        country: client.country,
      };
      schedule.phone = client.phone;
      schedule.email = client.email;
      schedule.website = client.website;
      schedule.last_updated = moment(venues[i].updatedAt).format();
      resData.venues.push(venue);
    }
  } else {
    // page number is invalid
  }

  return res.json(resData);
}
