const moment = require('moment-timezone');
const ObjectionEventTimeSlot = require('../../objection-models/EventTimeSlot');

const VALID_EAGER_POPULATE_FIELDS = [
  'event',
  'event.room',
  'event.room.branch',
  'event.image',
  'event.teachers',
  'event.teachers.image',
  'event.signups',
  'event.signups.user',
  'event.signups.user.image',
  'event.event_group',
];

const VALID_MANUAL_POPULATE_FIELDS = [
  'event.signup_count',
  'user_is_signed_up_for_event',
  'event_accepts_customer_signups',
  'user_can_sign_up_for_event',
  'event_has_started',
  'event_is_fully_booked',
  'user_can_sign_off_from_event',
];

const DEPRECATED_POPULATE_FIELDS = [
  'location',
  'room',
  'room.branch',
  'signup_count',
];

module.exports = {
  friendlyName: 'Find Event time slots',
  description: 'Finds event time slots',

  inputs: {
    event: {
      type: 'json',
      description: 'An event to find time slots for. Only required if startDate and endDate are not set.',
      required: false,
    },
    startDate: {
      type: 'string',
      regex: /^\d\d\d\d-\d\d-\d\d$/,
      description: 'Only find time slots on this date or later. Required if event is not specified',
      required: false,
    },
    endDate: {
      type: 'string',
      regex: /^\d\d\d\d-\d\d-\d\d$/,
      description: 'Only find time slots on this date and earlier. Required if event is not specified',
      required: false,
    },
    teacher: {
      type: 'json',
      description: 'Only find time slots for events with this teacher',
      required: false,
    },
    branch: {
      type: 'json',
      description: 'Only find time slots for events in this branch',
      required: false,
    },
    onlyEventsVisibleInCalendar: {
      type: 'boolean',
      description: 'Only show time slots for events that have "show_in_calendar=true". TEMPORARILY ALWAYS TRUE, because APP',
      defaultsTo: false,
    },
    includeEventsNotVisibleInCalendar: {
      type: 'boolean',
      description: 'TEMPORARY HACK, because the app did not set onlyEventsVisibleInCalendar=true',
      defaultsTo: false,
    },
    populate: {
      type: 'json',
      description: `An array of relation fields that should be populated. Dot notation allows for multi-level populating. Allowed fields:[${_.concat(VALID_EAGER_POPULATE_FIELDS, VALID_MANUAL_POPULATE_FIELDS)}]`,
      defaultsTo: [],
    },
  },

  exits: {
    invalidPopulateFields: {
      responseType: 'badRequest',
    },
    eventOrDateRangeMustBeSpecified: {
      responseType: 'badRequest',
    },
    startDateTooEarly: {
      responseType: 'badRequest',
    },
    endDateBeforeStartDate: {
      responseType: 'badRequest',
    },
    dateRangeLongerThanOneYear: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    const validPopulateFields = _.concat(VALID_EAGER_POPULATE_FIELDS, VALID_MANUAL_POPULATE_FIELDS, DEPRECATED_POPULATE_FIELDS);

    // Accept url arrays with keys, which are parsed as objects
    const populate = _.values(inputs.populate);

    const invalidPopulateFields = _.difference(populate, validPopulateFields);

    if (invalidPopulateFields.length) {
      return exits.invalidPopulateFields('The following populate fields are invalid: ' + invalidPopulateFields.join(', '));
    }

    if (!inputs.event && !(inputs.startDate && inputs.endDate)) {
      return exits.eventOrDateRangeMustBeSpecified('Either an event ID or a date range must be specified');
    }

    const query = ObjectionEventTimeSlot.query()
      .from({ets: 'event_time_slot'})
      .innerJoin({e: 'event'}, 'ets.event', 'e.id')
      .where({
        'ets.client': this.req.client.id,
        'ets.archived': false,
        'e.archived': false,
      });


    if (inputs.startDate && inputs.endDate) {

      let startDate = moment(inputs.startDate, 'YYYY-MM-DD');
      let endDate = moment(inputs.endDate, 'YYYY-MM-DD');

      if (startDate.year() < 2017) {
        return exits.startDateTooEarly('startDate must be in 2017 or later');
      }

      if (endDate.isBefore(startDate, 'day')) {
        return exits.endDateBeforeStartDate('endDate must be the same as or after startDate');
      }

      if (endDate.diff(startDate, 'year') >= 1) {
        return exits.dateRangeLongerThanOneYear('Date range can not be longer than one year');
      }

      query
        .andWhere('date', '>=', startDate.format('YYYY-MM-DD'))
        .andWhere('date', '<=', endDate.format('YYYY-MM-DD'));

    }


    if (inputs.event) {
      query.andWhere('ets.event', inputs.event);
    }

    if (inputs.teacher) {
      query
        .innerJoin({e_teacher: 'event'}, 'ets.event', 'e_teacher.id')
        .innerJoin({et_ute: 'event_teachers__user_teaching_events'}, 'et_ute.event_teachers', 'e_teacher.id')
        .innerJoin({u_teacher: 'user'}, 'et_ute.user_teaching_events', 'u_teacher.id')
        .andWhere('et_ute.user_teaching_events', inputs.teacher)
        .andWhere('u_teacher.archived', false);
    }

    if (inputs.branch) {
      query
        .innerJoin({e_branch: 'event'}, 'ets.event', 'e_branch.id')
        .innerJoin({r: 'room'}, 'e_branch.room', 'r.id')
        .andWhere('r.branch', inputs.branch);
    }

    // TODO: FIX MOBILE APP AND REMOVE THIS TEMPORARY HACK
    if ((inputs.onlyEventsVisibleInCalendar || true) && !inputs.includeEventsNotVisibleInCalendar) {
      query
        .innerJoin({e_show_in_calendar: 'event'}, 'ets.event', 'e_show_in_calendar.id')
        .andWhere('e_show_in_calendar.show_in_calendar', true);
    }


    const eagerPopulateFields = _.intersection(populate, VALID_EAGER_POPULATE_FIELDS);
    if (_.includes(populate, 'event.signup_count') && !_.includes(eagerPopulateFields, 'event')) {
      eagerPopulateFields.push('event');
    }
    const eagerConfig = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields);

    query.modifyEager('event.teachers', teachersBuilder => {
      teachersBuilder.where('archived', false);
    });
    query.modifyEager('event.signups', signupsBuilder => {
      signupsBuilder.where('archived', false);
    });
    query.modifyEager('event.signups.user', signupsUserBuilder => {
      signupsUserBuilder.where('archived', false);
    });

    query.eager(eagerConfig);

    const eventTimeSlots = await query;

    const manualPopulateFields = _.keyBy(_.intersection(populate, VALID_MANUAL_POPULATE_FIELDS));

    if (manualPopulateFields['event.signup_count']) {
      await sails.helpers.populate.eventTimeSlots.eventSignupCount(eventTimeSlots);
    }

    if (manualPopulateFields['user_is_signed_up_for_event']) {
      await sails.helpers.populate.eventTimeSlots.userIsSignedUpForEvent(eventTimeSlots, this.req.user);
    }

    if (manualPopulateFields['event_accepts_customer_signups']) {
      await sails.helpers.populate.eventTimeSlots.eventAcceptsCustomerSignups(eventTimeSlots);
    }

    if (manualPopulateFields['user_can_sign_up_for_event']) {
      await sails.helpers.populate.eventTimeSlots.userCanSignUpForEvent(eventTimeSlots, this.req.user);
    }

    if (manualPopulateFields['event_has_started']) {
      await sails.helpers.populate.eventTimeSlots.eventHasStarted(eventTimeSlots);
    }

    if (manualPopulateFields['event_is_fully_booked']) {
      await sails.helpers.populate.eventTimeSlots.eventIsFullyBooked(eventTimeSlots);
    }

    if (manualPopulateFields['user_can_sign_off_from_event']) {
      await sails.helpers.populate.eventTimeSlots.userCanSignOffFromEvent(eventTimeSlots, this.req.user);
    }

    return exits.success(eventTimeSlots);

  },

};
