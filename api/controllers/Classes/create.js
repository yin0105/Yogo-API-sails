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

    exits.success(createdClass);

    const resp = await sails.helpers.integrations.classpass.update.with({
      update:  {
        "type": "SCHEDULE",
        "payload": {
            "id": "mno456",
            "partner_id": "abc123",
            "venue_id": "xyz789",
            "start_datetime": "2019-01-02T20:30:00+00:00",
            "end_datetime": "2019-01-02T21:00:00+00:00",
            "class": {
                "id": "vth395",
                "name": "Vinyasa Level 1",
                "description": "A 30 minute intro to vinyasa yoga.",
                "last_updated": "2019-01-02T20:30:38+00:00"
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
                "id": "ehv493",
                "name": "Studio A",
                "last_updated": "2019-01-02T20:30:38+00:00"
            },
            "address": {
                "address_line1": "123 Main St",
                "address_line2": "Floor 1",
                "city": "New York",
                "state": "NY",
                "zip": "10016",
                "country": "US"
            },
            "coordinate": {
                "latitude": 46.8697822,
                "longitude": -113.995265
            },
            "total_spots": 12,
            "available_spots": 10,
            "has_layout": true,
            "layout": [
                {
                    "x": 1,
                    "y": 1,
                    "label": "A"
                }
            ],
            "available_spot_labels": [
                "A",
                "B",
                "C",
                "D"
            ],
            "bookable_window_starts": "2019-01-11T20:30:00",
            "bookable_window_ends": "2019-01-12T20:30:00",
            "late_cancel_window": "08:00",
            "is_cancelled": false,
            "last_updated": "2019-01-02T20:30:38+00:00"
        }
      },
    })

  },
};
