const moment = require('moment');
const knex = require('../../services/knex')
module.exports = {
  friendlyName: 'Create class',

  fn: async function (inputs, exits) {

    let classData = _.pick(this.req.body, [
      'date',
      'start_time',
      'end_time',
      'class_type',
      'subtitle',
      'teachers',
      'room',
      'seats',
      'studio_attendance_enabled',
      'livestream_enabled',
    ]);

    classData.client = this.req.client.id;

    // This is for when we push the new API but livestream is not activated in the web apps yet.
    // TODO: Remove this
    if (
      typeof classData.studio_attendance_enabled === 'undefined'
      && typeof classData.livestream_enabled === 'undefined'
    ) {
      classData.studio_attendance_enabled = true;
      classData.livestream_enabled = false;
    }

    if (classData.room === '') {
      classData.room = null;
    }

    const createdClass = await Class.create(classData).fetch();
    console.log("createdClass = ", createdClass);

    // exits.success(createdClass);

    let payload = {};

    const schedule = await knex.from({c: 'class'})
      .leftJoin({r: 'room'}, 'r.id', 'c.room')
      .leftJoin({b: 'branch'}, 'b.id', 'r.branch')
      .leftJoin({ct: 'class_type'}, 'ct.id', 'c.class_type')
      .select(
        knex.raw("c.id AS schedule_id"), 
        knex.raw("CONCAT(c.date, 'T', c.`start_time`) AS start_datetime"),
        knex.raw("CONCAT(c.date, 'T', c.`end_time`) AS end_datetime"),
        knex.raw("c.updatedAt AS schedule_last_updated"),
        knex.raw("c.cancelled AS cancelled"),
        knex.raw("ct.id AS class_type_id"),
        knex.raw("ct.name AS class_type_name"),
        knex.raw("ct.description AS class_type_description"),
        knex.raw("ct.updatedAt AS class_type_last_updated"),
        knex.raw("r.id AS room_id"),
        knex.raw("r.name AS room_name"),
        knex.raw("r.updatedAt AS room_last_updated"),
        knex.raw("b.id AS venue_id"),
        knex.raw("c.seats AS total_spots"),
        knex.raw("c.classpass_com_all_seats_allowed AS classpass_com_all_seats_allowed"),
        knex.raw("c.classpass_com_number_of_seats_allowed AS classpass_com_number_of_seats_allowed"),
        knex.raw("c.seats AS seats"),
        knex.raw("c.subtitle AS subtitle"),
        knex.raw("c.classpass_com_number_of_seats_allowed AS classpass_com_number_of_seats_allowed"))
      .where("c.id", createdClass.id);
      // .andWhere("b.id", venue_id)
      // .andWhereRaw("DATE BETWEEN ? AND ?", [start_date, end_date])
      // .orderBy('c.id');

    console.log("schedule = ", schedule);

    const teachers = await knex({c: 'class_teachers__user_teaching_classes'})
      .leftJoin({u: 'user'}, 'u.id', 'c.user_teaching_classes')
      .leftJoin({i: 'image'}, 'i.id', 'u.image')
      .select(
        knex.raw("c.id AS id"), 
        knex.raw("u.first_name AS first_name"),
        knex.raw("u.last_name AS last_name"),
        knex.raw("u.updatedAt AS last_updated"),
        knex.raw("i.original_width AS width"),
        knex.raw("i.original_height AS height"),
        knex.raw("i.filename AS uri"))
      .where("c.class_teachers", schedule[0].id)
      .orderBy('c.id');

    payload.teachers = await Promise.all(teachers.map( async(teacher) => {
      let images = [];
      if (teacher.uri) {
        if (teacher.width) {
          images.push({
            "width": teacher.width,
            "height": teacher.height,
            "url": `${sails.config.imgixServer}/${teacher.uri}`,
          });
          
        } else {
          const result = await axios.get(`${sails.config.imgixServer}/${teacher.uri}?fm=json`).catch(error => {console.log(error)})
          images.push({
            "width": result.data.PixelWidth,
            "height": result.data.PixelHeight,
            "url": `${sails.config.imgixServer}/${teacher.uri}`,
          });
        }
      } 

      return {
        "id": teacher.id.toString(),
        "first_name": teacher.first_name,
        "last_name": teacher.last_name,
        "last_updated": moment(teacher.last_updated).format(),
        "images": images,
      }
      
    }));

    const classSignups = await knex({c: 'class_signup'})
      .select( knex.raw("COUNT(*) AS signups") )
      .where("c.class", schedule[0].schedule_id)
      .andWhere("c.cancelled_at", 0);
    
    const actual_number_of_available_seats = schedule[0].seats - classSignups[0].signups;
    const classpass_com_all_seats_allowed = schedule[0].classpass_com_all_seats_allowed;
    const classpass_com_number_of_seats_allowed = schedule[0].classpass_com_number_of_seats_allowed;
    const class_start = moment(schedule[0].start_datetime); // new Date(schedule[0].start_datetime);
    const minsDiff = class_start.diff(new Date(), 'minutes');

    payload.available_spots = actual_number_of_available_seats;
    if (!classpass_com_all_seats_allowed) {
      payload.available_spots = Math.min(actual_number_of_available_seats, classpass_com_number_of_seats_allowed);

      if (classpass_com_release_all_seats_before_class_start) {
        if (minsDiff > 0 && minsDiff < classpass_com_release_all_seats_minutes_before_class_start) {
          payload.available_spots = actual_number_of_available_seats;
        }
      }
    }

    payload.late_cancel_window = schedule[0].seats == 1? class_start.subtract( private_class_signup_deadline, 'minutes') : class_start.subtract( class_signoff_deadline, 'minutes');
    payload.bookable_window_starts = class_start.subtract( customer_can_sign_up_for_class_max_days_before_class, "days").local().format('YYYY-MM-DDTHH:mm:ss');
    payload.bookable_window_ends = (schedule[0].seats == 1? class_start.subtract( private_class_signup_deadline, 'minutes') : class_start).local().format('YYYY-MM-DDTHH:mm:ss');

    payload.id = createdClass.id;
    payload.partner_id = classData.client;
    payload.venue_id = schedule[0].venue_id;
    payload.start_datetime = schedule[0].start_datetime;
    payload.end_datetime = schedule[0].end_datetime;
    payload.class = {
        id: schedule[0].class_type_id.toString(),
        name: schedule[0].class_type_name,
        description: schedule[0].class_type_description,
        last_updated: moment(schedule[0].class_type_last_updated).format(),
    };
    payload.schedule_name = schedule[0].subtitle;
    payload.room = {
      id: schedule[0].room_id.toString(),
      name: schedule[0].room_name,
      last_updated: moment(schedule[0].room_last_updated).format(),
    };
    payload.total_spots = schedule[0].total_spots;
    payload.has_layout = false;
    payload.is_cancelled = false;
    payload.last_updated = moment(schedule[0].schedule_last_updated).format();

    console.log("payload = ",payload);

    const resp = await sails.helpers.integrations.classpass.update.with({
      update:  {
        "type": "SCHEDULE",
        "payload": payload
      },
    })

  },
};
