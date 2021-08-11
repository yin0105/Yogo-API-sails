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

    exits.success(createdClass);


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
        knex.raw("c.classpass_com_number_of_seats_allowed AS classpass_com_number_of_seats_allowed"))
      .where("c.id", createdClass.id);
      // .andWhere("b.id", venue_id)
      // .andWhereRaw("DATE BETWEEN ? AND ?", [start_date, end_date])
      // .orderBy('c.id');

    const resp = await sails.helpers.integrations.classpass.update.with({
      update:  {
        "type": "SCHEDULE",
        "payload": {
            "id": createdClass.id,
            "partner_id": classData.client,
            "venue_id": schedule[0].venue_id,
            "start_datetime": schedule[0].start_datetime,
            "end_datetime": schedule[0].end_datetime,
            "class": {
                "id": schedule[0].class_type_id.toString(),
                "name": schedule[0].class_type_name,
                "description": schedule[0].class_type_description,
                "last_updated": moment(schedule[0].class_type_last_updated).format(),
            },
            "schedule_name": "AM Yoga",
            "teachers": [
                {
                    "id": "uvt934",
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "display_name": "Jane D",
                    "images": [
                        {
                            "width": 600,
                            "height": 200,
                            "url": "https://images.unsplash.com/photo-1490187291333-b4ece7bec2e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
                        }
                    ],
                    "last_updated": "2019-01-02T20:30:38+00:00"
                }
            ],
            "room": {
                "id": schedule[0].room_id.toString(),
                "name": schedule[0].room_name,
                "last_updated": moment(schedule[0].room_last_updated).format(),
            },
            // "address": {
            //     "address_line1": "123 Main St",
            //     "address_line2": "Floor 1",
            //     "city": "New York",
            //     "state": "NY",
            //     "zip": "10016",
            //     "country": "US"
            // },
            // "coordinate": {
            //     "latitude": 46.8697822,
            //     "longitude": -113.995265
            // },
            "total_spots": schedules[i].total_spots,
            "available_spots": 10,
            "has_layout": false,
            // "layout": [
            //     {
            //         "x": 1,
            //         "y": 1,
            //         "label": "A"
            //     }
            // ],
            // "available_spot_labels": [
            //     "A",
            //     "B",
            //     "C",
            //     "D"
            // ],
            "bookable_window_starts": "2019-01-11T20:30:00",
            "bookable_window_ends": "2019-01-12T20:30:00",
            "late_cancel_window": "08:00",
            "is_cancelled": false,
            "last_updated": moment(schedules[i].schedule_last_updated).format()
        }
      },
    })

  },
};
