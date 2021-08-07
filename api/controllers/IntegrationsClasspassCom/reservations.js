const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

const reservation = async (user_id, schedule_id, reservation_id, partner_id) => {
  console.log("== before");
  let errCode = "";
  let result = await sails.helpers.classes.createSignup.with({
    user: user_id,
    classItem: schedule_id,
    checkCustomerIn: false,
    allowOverbooking: false,
    classpass_com_reservation_id: reservation_id,
  })
    .tolerate('alreadySignedUp', async () => {
      errCode = 'alreadySignedUp';
    })
    .tolerate('classCancelled', async () => {
      errCode = 'classCancelled';
    })
    .tolerate('classIsFull', async () => {
      errCode = 'classIsFull';
    })
    .tolerate('noAccess', async () => {
      errCode = 'noAccess';
    });
  
  
  if (errCode != "") {
    return {
      err: true,
      errMsg: errCode,
    };
  }
  if (!result) return {
    err: true,
    errMsg: "",
  };

  if (result.used_class_pass || result.used_class_pass_id) {
    const classPassId = sails.helpers.util.idOrObjectIdInteger(result.used_class_pass_id || result.used_class_pass);
    const classPass = await ClassPass.findOne(classPassId).populate('class_pass_type');
    if (classPass.class_pass_type.pass_type === 'fixed_count') {
      const classDescription = await sails.helpers.classes.getDescription(result.class_id || result.class);
      let logMessage = sails.helpers.t(
        'classPassLog.classPassUsedToSignUpForClass',
        [classDescription, classPass.classes_left],
      );
      await sails.helpers.classPassLog.log(classPass, logMessage);
    }
  }

  return result;
}

module.exports = async (req, res) => {
  const reservation_id = req.body.reservation_id;
  const partner_id = req.body.partner_id;
  const venue_id = req.body.venue_id;
  const schedule_id = req.body.schedule_id;
  const user_ = req.body.user;
  const spot_label = req.body.spot_label ? req.body.spot_label: "";

  if ( !reservation_id || !partner_id || !venue_id || !schedule_id || !user_ ) {
    // bad request
    return res.badRequest("Missing some params");
  }

  const user_id = user_.user_id;
  const user_email = user_.user_email;
  const username = user_.user_username;
  const first_name = user_.first_name;
  const last_name = user_.last_name;
  const gender = user_.gender;  
  const address = user_.address;
  const emergency_contact = user_.emergency_contact;

  if ( !user_id || !user_email || !username || !first_name || !last_name || !gender || !address || !emergency_contact ) {
    // bad request
    return res.badRequest("Missing some params");
  }

  const phone = user_.phone ? user_.phone: "";
  const birthday = user_.birthday ? user_.birthday : "";
  const address_1 = address.address_line1 ? address.address_line1: "";
  const address_2 = address.address_line2 ? address.address_line2: "";
  const city = address.city ? address.city: "";
  const state = address.state ? address.state: "";
  const zip = address.zip ? address.zip: "";
  const country = address.country ? address.country: "";

  const emergency_contact_name = emergency_contact.name ? emergency_contact.name: "";
  const emergency_contact_phone = emergency_contact.phone ? emergency_contact.phone: "";

  let user = await User.findOne({email: user_email});
  let result
  if (user) {
    if (user_id != user_.classpass_com_user_id) {
      // other user with the email already exists
      return res.badRequest("Other user with the email already exists");
    } else {
      // reservation
      result = await reservation (user.id, schedule_id, reservation_id, partner_id);
    }
  } else {
    // user registration
    user = await User.create({
      email: user_email,
      first_name: first_name,
      last_name: last_name,
      phone: phone,
      date_of_birth: birthday,
      address_1: address_1,
      address_2: address_2,
      city: city,
      zip_code: zip,
      country: country,
      client: partner_id,
      classpass_com_user_id: user_id,
    }).fetch();
    // if (user) {
    console.log(user, user.id, schedule_id, reservation_id, partner_id);
    result = await reservation (user.id, schedule_id, reservation_id, partner_id);
    // }
  }
  if (result.err) {
    if (result.errMsg == 'classIsFull') {
      return res.badRequest({
        "error": {
          "code": 4003,
          "name": "NO_CAPACITY_EXCEPTION",
          "message": "schedule has no available spots"
        }
      });
    } else if (result.errMsg == 'classCancelled') {
      return res.badRequest({
        "error": {
          "code": 4004,
          "name": "CLASS_CANCELLED_EXCEPTION",
          "message": "schedule is cancelled"
          }
      });
    } else if (result.errMsg == 'alreadySignedUp') {
      return res.badRequest({
        "error": {
          "code": 4006,
          "name": "ALREADY_RESERVED_EXCEPTION",
          "message": "user has already reserved this class"
          }
      });
    } else if (result.errMsg == 'alreadySignedUp') {
      return res.badRequest({
        "error": {
          "code": 4001,
          "name": "RESERVATION_EXCEPTION",
          "message": "reservation failed"
        }
      });
    } else {
      return res.badRequest({
        "error": {
          "code": 4001,
          "name": "RESERVATION_EXCEPTION",
          "message": "reservation failed"
        }
      });
    }
  } else {
    return res.ok({"spot_label": spot_label});
  }
}
