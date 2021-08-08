const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {
  const reservation_id = req.params.id;
  let is_late_cancel = req.body.is_late_cancel;
  const partner_id = req.body.partner_id;

  const reservation = await knex({cs: 'class_signup'})
  .leftJoin({c: 'class'}, 'c.id', 'cs.class')
  .select(
    knex.raw("cs.classpass_com_reservation_id AS reservation_id"),
    knex.raw("cs.cancelled_at AS cancelled_at"), 
    knex.raw("CONCAT(c.date, 'T', start_time) AS start_time"),
    knex.raw("c.end_time AS end_time"),
    knex.raw("c.seats AS seats"))
  .where('cs.classpass_com_reservation_id', reservation_id);
  
  if (reservation.length == 0) {
    return res.badRequest({
      "error": {
      "code": 4002,
      "name": "CANCELLATION_EXCEPTION",
      "message": "cancellation failed"
      } 
    });
  }

  const class_signoff_deadline = await sails.helpers.clientSettings.find(partner_id, 'class_signoff_deadline');
  const private_class_signup_deadline = await sails.helpers.clientSettings.find(partner_id, 'private_class_signup_deadline');      
  const start_window = moment(`${reservation[0].start_time}`);
  const late_cancel_window = reservation[0].seats == 1? start_window.subtract( private_class_signup_deadline, 'minutes') : start_window.subtract( class_signoff_deadline, 'minutes');

  if (moment() > start_window) {
    return res.badRequest({
      "error": {
      "code": 4002,
      "name": "CANCELLATION_EXCEPTION",
      "message": "cancellation failed"
      } 
    });
  }

  if (moment() > late_cancel_window) {
    is_late_cancel = true;
  } else {
    is_late_cancel = false;
  }
  
  await ClassSignup.update({
    classpass_com_reservation_id: reservation_id,
    archived: false,
    cancelled_at: 0,
  }, {
    cancelled_at: Date.now(),
    late_cancel: is_late_cancel,
  });

  

  // console.log({
  //   "is_late_cancel": is_late_cancel
  // });
  // return res.ok();
  return res.ok({
    "is_late_cancel": is_late_cancel
  });
}
