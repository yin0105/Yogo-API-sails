const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
  const partner_id = req.params.partner_id;
  const attendance_id = req.params.attendance_id;
  const schedule_id = req.params.schedule_id;

  const page = req.query.page;
  const page_size = req.query.page_size; 
/**
 * SELECT cs.updateAt, cs.cancelled_at, cs.`classpass_com_reservation_id`, c.`cancelled`  
 * FROM class_signup cs LEFT JOIN class c ON cs.class=c.id 
 * WHERE c.id=540 
 */
  const attendances = await knex({cs: 'class_signup'})
  .leftJoin({c: 'class'}, 'c.id', 'cs.class')
  .select(
    knex.raw("cs.classpass_com_reservation_id AS reservation_id"),
    knex.raw("cs.updatedAt AS updatedAt"),
    knex.raw("cs.cancelled_at AS cancelled_at"), 
    knex.raw("c.cancelled AS cancelled"),
    knex.raw("c.date AS date"),
    knex.raw("CONCAT(c.date, 'T', start_time) AS start_time"),
    knex.raw("c.end_time AS end_time"),
    knex.raw("c.seats AS seats"))
  .where('c.id', schedule_id);
  
  if (!page) return res.badRequest("Missing query 'page'");
  if (!page_size) return res.badRequest("Missing query 'page_size'");

  const countOfAttendances = attendances.length;
  let resData = {};
  resData.attendances = [];
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
      attendance.reservation_id = attendances[i].reservation_id;      

      const class_signoff_deadline = await sails.helpers.clientSettings.find(partner_id, 'class_signoff_deadline');
      const private_class_signup_deadline = await sails.helpers.clientSettings.find(partner_id, 'private_class_signup_deadline');      
      const start_window = moment(`${attendances[i].start_time}`);
      const cancelled_window = moment(`${attendances[i].cancelled_at}`);
      const late_cancel_window = attendances[i].seats == 1? start_window.subtract( private_class_signup_deadline, 'minutes') : start_window.subtract( class_signoff_deadline, 'minutes');

      // check status
      if (attendances[i].cancelled) {
        attendance.status = "CLASS_CANCELLED";
      } else if (attendances[i].cancelled_at == 0) {
        if (moment() < start_window) {
          attendance.status = "ENROLLED";
        } else {
          attendance.status = "ATTENDED";
        }
      } else {
        if ( cancelled_window < late_cancel_window) {
          attendance.status = "CANCELLED";
        } else if ( cancelled_window < start_window) {
          attendance.status = "LATE_CANCELLED";
        } else {
          attendance.status = "MISSED";
        }
      }

      attendance.last_updated = moment(attendances[i].updatedAt).format();
      
      resData.attendances.push(attendance);
    }
  } else {
    // page number is invalid
  }

  return res.json(resData);
}
