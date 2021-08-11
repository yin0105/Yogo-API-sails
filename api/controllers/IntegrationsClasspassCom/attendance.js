const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
  console.log("header = ", req.headers);
  const partner_id = req.params.partner_id;
  const attendance_id = req.params.attendance_id;
  const schedule_id = req.params.schedule_id;

  const page = req.query.page ? req.query.page : 1;
  const page_size = req.query.page_size ? req.query.page_size : 100; 

  const attendances = await knex({cs: 'class_signup'})
  .leftJoin({c: 'class'}, 'c.id', 'cs.class')
  .leftJoin({u: 'user'}, 'u.id', 'cs.user')
  .select(
    knex.raw("cs.classpass_com_reservation_id AS reservation_id"),
    knex.raw("cs.updatedAt AS updatedAt"),
    knex.raw("cs.cancelled_at AS cancelled_at"),
    knex.raw("cs.checked_in AS checked_in"), 
    knex.raw("c.cancelled AS cancelled"),
    knex.raw("c.date AS date"),
    knex.raw("CONCAT(c.date, 'T', start_time) AS start_time"),
    knex.raw("c.end_time AS end_time"),
    knex.raw("c.seats AS seats"),
    knex.raw("u.classpass_com_user_id AS cp_user_id"))
  .where('c.id', schedule_id);
  
  if (!page) return res.badRequest("Missing query 'page'");
  if (!page_size) return res.badRequest("Missing query 'page_size'");

  const countOfAttendances = attendances.length;
  let resData = {};
  resData.attendance = [];
  resData.pagination = {
    page: page,
    page_size: page_size,
    total_pages: Math.ceil(countOfAttendances / page_size)
  };

  if (page_size * (page - 1) < countOfAttendances) {
    // page number is valid
    const numOfLastAttendance = (page_size * page < countOfAttendances) ? page_size * page : countOfAttendances;
    for (let i = (page_size * (page - 1)); i < numOfLastAttendance; i++) {
      let attendance = {};      
      attendance.cp_user_id = attendances[i].cp_user_id;      
      attendance.reservation_id = attendances[i].reservation_id;      

      const start_window = moment(`${attendances[i].start_time}`);

      // check status
      if (attendances[i].cancelled) {
        attendance.status = "CLASS_CANCELLED";
      } else if (attendances[i].cancelled_at == 0) {        
        if (moment() < start_window) {
          attendance.status = "ENROLLED";
        } else {
          if (attendances[i].checked_in) {
            attendance.status = "ATTENDED";
          } else {
            attendance.status = "MISSED";
          }          
        }
      } else {
        if (attendances[i].late_cancel) {
          attendance.status = "LATE_CANCELLED";
        } else {
          attendance.status = "CANCELLED";
        }
      }

      attendance.last_updated = moment(attendances[i].updatedAt).format();
      
      resData.attendance.push(attendance);
    }
  } else {
    // page number is invalid
  }

  return res.json(resData);
}
