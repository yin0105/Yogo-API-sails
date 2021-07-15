const UserObj = require('../../objection-models/User');
const moment = require('moment-timezone');
const VALID_EAGER_POPULATE_FIELDS = [
  'image',

  'memberships',
  'memberships.membership_type',
  'memberships.payment_option',
  'memberships.payment_subscriptions',
  'memberships.pending_no_show_fees',
  'memberships.pending_no_show_fees.class',
  'memberships.pending_no_show_fees.class.class_type',

  'class_passes',
  'class_passes.class_pass_type',

  'class_signups',
  'class_signups.class',
  'class_signups.class.class_type',

  'class_waiting_list_signups',
  'class_waiting_list_signups.class',
  'class_waiting_list_signups.class.class_type',

  'class_livestream_signups',
  'class_livestream_signups.class.class_type',

  'event_signups',

  'invoices',
];

const VALID_MANUAL_POPULATE_FIELDS = [
  'memberships.status_text',
  'memberships.next_payment',
  'memberships.current_membership_pause',
  'memberships.upcoming_membership_pause',
  'memberships.current_or_upcoming_membership_pause',
  'video_groups_that_customer_can_access',

];

module.exports = {

  friendlyName: 'Find users',

  inputs: {
    id: {
      type: 'json',
    },
    searchQuery: {
      type: 'string',
    },
    customer: {
      type: 'boolean',
    },
    admin: {
      type: 'boolean',
    },
    teacher: {
      type: 'boolean',
    },
    isTeachingVideo: {
      type: 'boolean',
    },
    hasClassesOrEventTimeSlotsFromDateForward: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
    email: {
      type: 'string',
    },
    populate: {
      type: 'json',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Users.find', this.req)) {
      return this.res.forbidden();
    }

    const query = UserObj.query().alias('u')
      .where({
        'u.client': this.req.client.id,
        'u.archived': 0,
      });


    if (inputs.id) {
      if (_.isArray(inputs.id)) {
        query.where('u.id', 'in', inputs.id);
      } else {
        query.where({'u.id': inputs.id});
      }
    }

    if (inputs.searchQuery) {
      const searchQueryParts = inputs.searchQuery.trim().replace(/ {2,}/, ' ').split(' ');

      _.each(searchQueryParts, (searchQueryPart) => {
        query.where(
          builder => builder
            .orWhere('u.first_name', 'like', `%${searchQueryPart}%`)
            .orWhere('u.last_name', 'like', `%${searchQueryPart}%`)
            .orWhere('u.email', 'like', `%${searchQueryPart}%`)
            .orWhere('u.phone', 'like', `%${searchQueryPart}%`),
        );
      });

      query.orderBy(['u.first_name', 'u.last_name', 'u.email', 'u.phone']);
      query.limit(20);
    }

    if (inputs.customer) {
      query.where({'u.customer': true});
    }

    if (inputs.admin) {
      query.where({'u.admin': true});
    }

    if (inputs.teacher) {
      query.where({'u.teacher': true});
      if (inputs.hasClassesOrEventTimeSlotsFromDateForward) {

        const teachersWithClassesFromDateForward = await knex({join_tbl: 'class_teachers__user_teaching_classes'})
          .innerJoin({c: 'class'}, 'join_tbl.class_teachers', 'c.id')
          .where('c.date', '>=', inputs.hasClassesOrEventTimeSlotsFromDateForward)
          .where({
            'c.archived': 0,
            'c.client': this.req.client.id,
          })
          .groupBy('join_tbl.user_teaching_classes')
          .select('join_tbl.user_teaching_classes');

        const teachersWithEventTimeSlotsFromDateForward = await knex({join_tbl: 'event_teachers__user_teaching_events'})
          .innerJoin({e: 'event'}, 'join_tbl.event_teachers', 'e.id')
          .innerJoin({ets: 'event_time_slot'}, 'ets.event', 'e.id')
          .where('ets.date', '>=', inputs.hasClassesOrEventTimeSlotsFromDateForward)
          .where({
            'ets.archived': 0,
            'e.archived': 0,
            'e.client': this.req.client.id,
          })
          .groupBy('join_tbl.user_teaching_events')
          .select('join_tbl.user_teaching_events');

        const userIdsWithClassesOrEventTimeSlotsFromDateForward = _.uniq(_.concat(
          _.map(teachersWithClassesFromDateForward, 'user_teaching_classes'),
          _.map(teachersWithEventTimeSlotsFromDateForward, 'user_teaching_events'),
        ));

        query.where('u.id', 'in', userIdsWithClassesOrEventTimeSlotsFromDateForward);

      }
    }

    if (inputs.isTeachingVideo) {
      query.joinRelation('teaching_videos', {alias: 'tv'})
        .where('tv.archived', 0)
        .groupBy('u.id');
    }

    if (inputs.email) {
      query.where({'u.email': this.req.query.email});
    }

    // Only show all fields to admin
    if (!this.req.user || (!this.req.user.admin && !this.req.user.teacher)) {
      query.select([
        'u.client',
        'u.id',
        'u.first_name',
        'u.last_name',
        'u.image',
        'u.teacher_description',
      ]);
    }

    if (inputs.populate && _.isArray(inputs.populate)) {
      const eagerPopulateFields = _.intersection(
        inputs.populate,
        VALID_EAGER_POPULATE_FIELDS,
      );
      query.eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields));
    }

    query
      .modifyEager(
        'memberships',
        q => q.where('archived', '0'),
      )
      .modifyEager(
        'class_passes',
        q => q.where('valid_until', '>=', moment.tz('Europe/Copenhagen').format('YYYY-MM-DD'))
          .andWhere('archived', 0),
      )
      .modifyEager('class_signups', q => q.where({cancelled_at: 0, archived: 0}))
      .modifyEager('class_livestream_signups', q => q.where({cancelled_at: 0, archived: 0}))
      .modifyEager('class_waiting_list_signups', q => q.where({cancelled_at: 0, archived: 0}))
      .modifyEager('event_signups', q => q.where('archived', 0));


    let users = await query;

    if (inputs.populate && _.includes(inputs.populate, 'teacher_ical_feed_url') && await sails.helpers.can2('populate.users.teacher-ical-feed-url', this.req)) {
      await sails.helpers.populate.users.teacherIcalFeedUrl(users);
    }

    /*if (inputs.populate && _.includes(inputs.populate, 'video_groups_that_customer_can_access')) {
      await sails.helpers.populate.users.videoGroupsThatCustomerCanAccess(users);
    }*/

    const manualPopulateFields = _.intersection(inputs.populate, VALID_MANUAL_POPULATE_FIELDS);

    for (let i = 0; i < manualPopulateFields.length; i++) {
      const manualPopulateField = manualPopulateFields[i];
      const fieldParts = manualPopulateField.split('.');

      if (fieldParts.length === 1) {
        await sails.helpers.populate.users[_.camelCase(manualPopulateField)](users);
        continue;
      }

      const populationName = fieldParts[fieldParts.length - 1];
      const collectionName = fieldParts[fieldParts.length - 2];

      const helperObject = require(`../../helpers/populate/${collectionName}/${_.kebabCase(populationName)}`);
      const helperRequiresI18n = !!helperObject.inputs.i18n;

      const path = fieldParts.slice(0, -1);
      const params = {};

      params[collectionName] = _.chain(users)
        .map(
          u => _.get(u, path),
        )
        .flatten()
        .value();
      params.i18n = helperRequiresI18n ? this.req.i18n : undefined;
      await sails.helpers.populate[collectionName][_.camelCase(populationName)].with(params);
    }

    return exits.success(users);
  },
};
