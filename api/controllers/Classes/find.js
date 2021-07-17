const moment = require('moment-timezone');
const ObjectionClass = require('../../objection-models/Class');

const VALID_EAGER_POPULATE_FIELDS = [
  'room',
  'room.branch',
  'class_type',
  'class_type.image',
  'teachers',
  'teachers.image',
  'signups',
  'signups.user',
  'signups.user.image',
  'signups.used_membership',
  'signups.used_membership.membership_type',
  'signups.used_class_pass',
  'signups.used_class_pass.class_pass_type',
  'signups.no_show_fee',
  'waiting_list_signups',
  'waiting_list_signups.user',
  'waiting_list_signups.user.image',
  'waiting_list_signups.used_membership',
  'waiting_list_signups.used_membership.membership_type',
  'waiting_list_signups.used_class_pass',
  'waiting_list_signups.used_class_pass.class_pass_type',
  'livestream_signups',
  'livestream_signups.user',
  'livestream_signups.user.image',
  'livestream_signups.used_membership',
  'livestream_signups.used_membership.membership_type',
  'livestream_signups.used_class_pass',
  'livestream_signups.used_class_pass.class_pass_type',
  'class_emails',
  'class_emails.instances',
  'class_emails.instances.recipient',
];

const VALID_MANUAL_POPULATE_FIELDS = [
  'signup_count',  
  'capacity_text',
  'ics_url',
  'user_has_access_to_class',
  'user_is_signed_up_for_class',
  'user_signup_id',
  'class_accepts_customer_signups',
  'class_accepts_livestream_signups',
  'class_has_started',
  'class_starts_today_or_later',
  'class_starts_today',
  'class_is_fully_booked',
  'class_signup_deadline_has_been_exceeded',
  'user_can_sign_up_for_class',
  'class_signoff_deadline_has_been_exceeded',
  'user_can_sign_off_from_class',
  'class_signoff_warning',
  'class_signoff_deadline_timestamp',
  'user_must_receive_warning_after_signoff_deadline',
  'waiting_list_count',
  'user_is_signed_up_for_waiting_list',
  'user_can_sign_up_for_waiting_list',
  'user_can_sign_off_from_waiting_list',
  'admin_can_sign_user_up_for_waiting_list',
  'admin_can_sign_user_off_from_waiting_list',
  'waiting_list_text',
  'user_number_on_waiting_list',
  'user_waiting_list_signup_id',
  'waiting_list_is_full',
  'waiting_list_count',
  'waiting_list_max',
  'user_primary_action',
  'livestream_signup_count',
  'user_is_signed_up_for_livestream',
  'user_livestream_signup_id',
  'user_has_access_to_livestream',
  'user_can_sign_up_for_livestream',
  'user_can_sign_off_from_livestream',
  'admin_can_sign_user_up_for_class',
  'admin_can_sign_user_off_from_class',
  'admin_can_sign_user_up_for_livestream',
  'admin_can_sign_user_off_from_livestream',
  'user_can_start_livestream',
  'livestream_link',
  'livestream_url',
  'livestream_url_for_app',
];

const VALID_CLASS_SIGNUP_MANUAL_POPULATE_FIELDS = [
  'signups.class_is_on_users_birthday',
  'signups.class_is_users_first_class',
];

const VALID_CLASS_WAITING_LIST_SIGNUP_MANUAL_POPULATE_FIELDS = [
  'waiting_list_signups.class_is_on_users_birthday',
  'waiting_list_signups.class_is_users_first_class',
];

const VALID_CLASS_LIVESTREAM_SIGNUP_MANUAL_POPULATE_FIELDS = [
  'livestream_signups.class_is_on_users_birthday',
  'livestream_signups.class_is_users_first_class',
];

const DEPRECATED_POPULATE_FIELDS = [
  'location',
  'signups.used_membership.real_user_image',
];

const ALL_VALID_POPULATE_FIELDS = _.concat(
  VALID_EAGER_POPULATE_FIELDS,
  VALID_MANUAL_POPULATE_FIELDS,
  VALID_CLASS_SIGNUP_MANUAL_POPULATE_FIELDS,
  VALID_CLASS_LIVESTREAM_SIGNUP_MANUAL_POPULATE_FIELDS,
  VALID_CLASS_WAITING_LIST_SIGNUP_MANUAL_POPULATE_FIELDS,
);

module.exports = {

  description: 'Finds classes. Can be filtered by dates, teachers, etc.',

  inputs: {
    id: {
      type: 'json',
      description: 'Class id or array of class ids. Return classes with this/these ids. Effectively replaces GET /classes/id (Classes.find-one). Either id or a date range must be specified.',
      required: false,
    },
    startDate: {
      type: 'string',
      regex: /^\d\d\d\d-\d\d-\d\d$/,
      description: 'The first date to look for classes on. Either a date range or class id(s) must be specified.',
      required: false,
    },
    endDate: {
      type: 'string',
      regex: /^\d\d\d\d-\d\d-\d\d$/,
      description: 'The last date to look for classes on. Either a date range or class id(s) must be specified.',
      required: false,
    },
    weekday: {
      type: 'number',
      description: 'Zero-based: Monday 0, Tuesday 1 ... Sunday 6',
      required: false,
    },
    startTime: {
      type: 'string',
      required: false,
      description: 'Only return classes that start at this specific time of day',
    },
    populate: {
      type: 'json',
      description: `An array of relation fields that should be populated. Dot notation allows for multiple-level-populating. Allowed fields:[
                  ${ALL_VALID_POPULATE_FIELDS.join(',\n')}
                  ]
                  Allowed, but deprecated fields:[
                  ${DEPRECATED_POPULATE_FIELDS.join(',\n')}
                  ]`,
      required: false,
    },
    teacher: {
      type: 'json',
      description: 'ID of a teacher or an array of IDs. Only classes that have that/those teacher(s) assigned, will be returned',
      required: false,
    },
    class_type: {
      type: 'json',
      description: 'ID of a ClassType or an array of IDs. Only classes with that/those class type(s) will be returned',
      required: false,
    },
    rooms: {
      type: 'json',
      description: 'ID of a room or an array of room IDs. Only classes in the specified room(s) will be returned',
      required: false,
    },
    branch: {
      type: 'number',
      description: 'A branch ID. Only classes in the specified branch will be returned',
    },
    seats: {
      type: 'number',
      description: 'Only classes with this number of seats will be returned',
    },
    sort: {
      type: 'json',
      description: 'An array of MySQL-type sort statements, e.g. ["date ASC", "start_time ASC"]',
      required: false,
    },
    sessionType: {
      type: 'string',
      description: '"group" is regular classes, "private" is classes with only one seat = private session',
      isIn: ['group', 'private', 'event'],
      required: false,
    },
    userToCalculateAccessFor: {
      type: 'number',
      description: 'Which user should "user_has_access_to_class", "user_is_signed_up_for_class" be calculated for? Only available to admins.',
      required: false,
    },
    userIsSignedUp: {
      type: 'number',
      description: 'Only return classes that this user is signed up for. Only available to the user itself and to admins. Overrides userToCalculateAccessFor',
      required: false,
    },
    userIsSignedUpOrOnWaitingList: {
      type: 'number',
      description: 'Only return classes that this user is signed up for or on waiting list for. Only available to the user itself and to admins. Overrides userToCalculateAccessFor',
      required: false,
    },
  },

  exits: {
    classIdOrDateRangeIsRequired: {
      responseType: 'badRequest',
    },
    endDateEarlierThanStartDate: {
      responseType: 'badRequest',
    },
    dateEarlierThanSystemStart: {
      responseType: 'badRequest',
    },
    intervalTooLong: {
      responseType: 'badRequest',
    },
    onlyAdminsCanSpecifyUserToCalculateAccessFor: {
      responseType: 'badRequest',
    },
    onlyAdminsOrUserSelfCanSpecifyUserToGetSignupsFor: {
      responseType: 'badRequest',
    },
    onlyAdminsOrUserSelfCanSpecifyUserToGetSignupsAndWaitingListSignupsFor: {
      responseType: 'badRequest',
    },
    invalidPopulateFields: {
      responseType: 'badRequest',
    },

  },

  fn: async function (inputs, exits) {

    // Accept regular arrays as well as keyed arrays (which are converted to objects)
    const populateFields = _.values(inputs.populate);

    const classesQuery = ObjectionClass.query().from({c: 'class'})
      .where('c.client', this.req.client.id)
      .andWhere('c.archived', false);

    if (
      !(
        inputs.id ||
        (inputs.startDate && inputs.endDate)
      )
    ) {
      return exits.classIdOrDateRangeIsRequired('Either class id(s) or date range must be specified');
    }

    if (inputs.id) {
      const classIds = _.isArray(inputs.id) ?
        inputs.id :
        [inputs.id];

      classesQuery.andWhere('id', 'in', classIds);
    }

    if (inputs.startDate && inputs.endDate) {

      const
        startDate = moment.tz(inputs.startDate, 'Europe/Copenhagen'),
        endDate = moment.tz(inputs.endDate, 'Europe/Copenhagen');

      if (endDate.isBefore(startDate)) {
        return exits.endDateEarlierThanStartDate('startDate must be before or equal to endDate');
      }

      if (startDate.isBefore(moment([2017, 0, 1])) || endDate.isBefore(moment([2017, 0, 1]))) {
        return exits.dateEarlierThanSystemStart('Yogo started in 2017. You can not request classes earlier than that.');
      }

      if (endDate.diff(startDate, 'years') > 0) {
        return exits.intervalTooLong('You can only request classes for up to one year at a time.');
      }

      classesQuery
        .andWhere('c.date', '>=', startDate.format('YYYY-MM-DD'))
        .andWhere('c.date', '<=', endDate.format('YYYY-MM-DD'));
    }

    if (typeof inputs.weekday !== 'undefined') {
      classesQuery
        .whereRaw('WEEKDAY(c.date) = ?', [inputs.weekday]);
    }

    if (inputs.startTime) {
      const startTime = inputs.startTime.length === 5 ? inputs.startTime + ':00' : inputs.startTime;
      classesQuery
        .andWhere('start_time', startTime);
    }

    if (typeof inputs.seats !== 'undefined') {
      classesQuery
        .andWhere('seats', inputs.seats);
    }

    if (inputs.teacher) {
      const teachers = _.isArray(inputs.teacher) ?
        inputs.teacher :
        [inputs.teacher];

      classesQuery
        .innerJoin({ctutc: 'class_teachers__user_teaching_classes'}, 'ctutc.class_teachers', 'c.id')
        .innerJoin({u_teacher: 'user'}, 'ctutc.user_teaching_classes', 'u_teacher.id')
        .andWhere('ctutc.user_teaching_classes', 'in', teachers)
        .andWhere('u_teacher.archived', false);
    }

    if (inputs.class_type) {
      const classTypes = _.isArray(inputs.class_type) ?
        inputs.class_type :
        [inputs.class_type];

      classesQuery.andWhere('c.class_type', 'in', classTypes);
    }

    if (inputs.rooms) {
      const rooms = _.isArray(inputs.rooms) ?
        inputs.rooms :
        [inputs.rooms];
      classesQuery.andWhere('c.room', 'in', rooms);
    } else if (inputs.branch) {
      const roomsInBranch = await Room.find({branch: inputs.branch, archived: false});
      classesQuery.andWhere('c.room', 'in', _.map(roomsInBranch, 'id'));
    }


    if (inputs.sessionType) {
      if (inputs.sessionType === 'private') {
        classesQuery.andWhere('c.seats', 1);
      } else if (inputs.sessionType === 'group') {
        classesQuery.andWhere(function () {
          this
            .where('c.seats', '>=', 2)
            .orWhere('c.seats', 0);
        });
      }
    }

    if (inputs.sort) {
      _.each(inputs.sort, directive => {
        const directiveParts = directive.split(' ');
        classesQuery.orderBy(directiveParts[0], directiveParts[1]);
      });
    }

    if (inputs.userIsSignedUp) {

      const userIsSignedUpUser = await User.findOne(inputs.userIsSignedUp);

      if (
        !(
          (
            this.req.authorizedRequestContext === 'admin' &&
            parseInt(this.req.client.id) === userIsSignedUpUser.client
          )
          ||
          (
            this.req.authorizedRequestContext === 'customer' &&
            parseInt(this.req.user.id) === parseInt(inputs.userIsSignedUp)
          )
        )
      ) {
        return exits.onlyAdminsOrUserSelfCanSpecifyUserToGetSignupsFor(
          'Only admins or the user itself can specify user to get signups for',
        );
      }

      const [signups, livestreamSignups] = await Promise.all([
        knex({cs: 'class_signup'})
          .where({
            user: inputs.userIsSignedUp,
            'cs.archived': 0,
            'cs.cancelled_at' : 0,
          })
          .innerJoin({c: 'class'}, 'cs.class', 'c.id')
          .andWhere('c.date', '>=', inputs.startDate)
          .andWhere('c.date', '<', inputs.endDate)
          .select('c.id')
        ,
        knex({cls: 'class_livestream_signup'})
          .where({
            user: inputs.userIsSignedUp,
            'cls.archived': 0,
            'cls.cancelled_at': 0,
          })
          .innerJoin({c: 'class'}, 'cls.class', 'c.id')
          .andWhere('c.date', '>=', inputs.startDate)
          .andWhere('c.date', '<', inputs.endDate)
          .select('c.id')
        ,
      ]);

      const signedUpForClassIds = _(
        _.concat(
          _.map(signups, 'id'),
          _.map(livestreamSignups, 'id'),
        ),
      ).uniq().value();

      classesQuery.andWhere('id', 'in', signedUpForClassIds);

      /*classesQuery
        .innerJoin({cs_user_is_signed_up: 'class_signup'}, 'cs_user_is_signed_up.class', 'c.id')
        .where('cs_user_is_signed_up.user', inputs.userIsSignedUp)
        .andWhere('cs_user_is_signed_up.archived', false)*/

    } else if (inputs.userIsSignedUpOrOnWaitingList) {

      const userIsSignedUpOrOnWaitingListUser = await User.findOne(inputs.userIsSignedUpOrOnWaitingList);

      if (
        !(
          (
            this.req.authorizedRequestContext === 'admin' &&
            parseInt(this.req.client.id) === userIsSignedUpOrOnWaitingListUser.client
          )
          ||
          (
            this.req.authorizedRequestContext === 'customer' &&
            parseInt(this.req.user.id) === parseInt(inputs.userIsSignedUpOrOnWaitingList)
          )
        )
      ) {
        return exits.onlyAdminsOrUserSelfCanSpecifyUserToGetSignupsAndWaitingListSignupsFor(
          'Only admins or the user itself can specify user to get signups and waiting list signups for',
        );
      }

      const [signups, livestreamSignups, waitingListSignups] = await Promise.all([
        knex({cs: 'class_signup'})
          .where({
            user: inputs.userIsSignedUpOrOnWaitingList,
            'cs.archived': 0,
            'cs.cancelled_at': 0,
          })
          .innerJoin({c: 'class'}, 'cs.class', 'c.id')
          .andWhere('c.date', '>=', inputs.startDate)
          .andWhere('c.date', '<', inputs.endDate)
          .select('c.id')
        ,
        knex({cls: 'class_livestream_signup'})
          .where({
            user: inputs.userIsSignedUpOrOnWaitingList,
            'cls.archived': 0,
            'cls.cancelled_at': 0,
          })
          .innerJoin({c: 'class'}, 'cls.class', 'c.id')
          .andWhere('c.date', '>=', inputs.startDate)
          .andWhere('c.date', '<', inputs.endDate)
          .select('c.id')
        ,
        knex({cs: 'class_waiting_list_signup'})
          .where({
            user: inputs.userIsSignedUpOrOnWaitingList,
            'cs.archived': 0,
            'cs.cancelled_at': 0,
          })
          .innerJoin({c: 'class'}, 'cs.class', 'c.id')
          .andWhere('c.date', '>=', inputs.startDate)
          .andWhere('c.date', '<', inputs.endDate)
          .select('c.id'),
      ]);

      const signedUpForClassIds = _(
        _.concat(
          _.map(signups, 'id'),
          _.map(livestreamSignups, 'id'),
          _.map(waitingListSignups, 'id'),
        ),
      ).uniq().value();

      classesQuery.andWhere('id', 'in', signedUpForClassIds);

    }

    let userToCalculateAccessFor;
    if (inputs.userIsSignedUp) {
      userToCalculateAccessFor = inputs.userIsSignedUp;
    } else if (inputs.userIsSignedUpOrOnWaitingList) {
      userToCalculateAccessFor = inputs.userIsSignedUpOrOnWaitingList;
    } else if (inputs.userToCalculateAccessFor) {
      if (
        this.req.authorizedRequestContext !== 'admin'
      ) {
        return exits.onlyAdminsCanSpecifyUserToCalculateAccessFor('Only admins can specify user to calculate access for');
      }

      userToCalculateAccessFor = inputs.userToCalculateAccessFor;

    } else {

      userToCalculateAccessFor = this.req.user;

    }


    /*************************************/
    /* POPULATING FIELDS */
    /*************************************/
    const validPopulateFields = _.concat(
      VALID_EAGER_POPULATE_FIELDS,
      VALID_MANUAL_POPULATE_FIELDS,
      VALID_CLASS_SIGNUP_MANUAL_POPULATE_FIELDS,
      VALID_CLASS_LIVESTREAM_SIGNUP_MANUAL_POPULATE_FIELDS,
      VALID_CLASS_WAITING_LIST_SIGNUP_MANUAL_POPULATE_FIELDS,
      DEPRECATED_POPULATE_FIELDS,
    );

    const invalidPopulateFields = _.difference(populateFields, validPopulateFields);

    if (invalidPopulateFields.length) {
      return exits.invalidPopulateFields('The following populate fields are invalid: ' + invalidPopulateFields.join(', '));
    }

    /*************************************/
    /* EAGER LOADING */
    /*************************************/

    const eagerPopulateFields = _.intersection(
      populateFields,
      VALID_EAGER_POPULATE_FIELDS,
    );

    const eagerLoadConfig = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields);

    classesQuery.eager(eagerLoadConfig);
    classesQuery.modifyEager('signups', signupsBuilder => {
      signupsBuilder.where({archived: false, cancelled_at: 0});
    });
    classesQuery.modifyEager('livestream_signups', signupsBuilder => {
      signupsBuilder.where({archived: false, cancelled_at: 0});
    });
    classesQuery.modifyEager('waiting_list_signups', signupsBuilder => {
      signupsBuilder.where({archived: false, cancelled_at: 0});
    });
    classesQuery.modifyEager('class_emails', classEmailsBuilder => {
      classEmailsBuilder.where({archived: false});
    });


    const teacherReturnFields = this.req.user && this.req.user.admin ?
      [
        "createdAt",
        "updatedAt",
        "user.id",
        "email",
        "first_name",
        "last_name",
        "address_1",
        "address_2",
        "zip_code",
        "city",
        "country",
        "phone",
        "date_of_birth",
        "teacher_description",
        "image",
      ] : [
        "user.id",
        "first_name",
        "last_name",
        "teacher_description",
        "image",
      ];

    classesQuery.modifyEager('teachers', teacherBuilder => {
      teacherBuilder
        .select(teacherReturnFields)
        .where('archived', false);
    });

    let classes = await classesQuery;

    /**************************/
    /* MANUAL POPULATIONS     */
    /**************************/

    const manualPopulateFields = _.intersection(
      populateFields,
      VALID_MANUAL_POPULATE_FIELDS,
    );

    for (let i = 0; i < manualPopulateFields.length; i++) {
      const manualPopulateField = manualPopulateFields[i];

      const helperObject = require('../../helpers/populate/classes/' + _.kebabCase(manualPopulateField));
      const helperRequiresUser = !!helperObject.inputs.user;
      const helperRequiresI18n = !!helperObject.inputs.i18n;

      const helper = sails.helpers.populate.classes[_.camelCase(manualPopulateField)];

      await helper.with({
        classes: classes,
        user: helperRequiresUser ? userToCalculateAccessFor : undefined,
        i18n: helperRequiresI18n ? this.req.i18n : undefined,
      });

    }

    /************************************/
    /* MANUAL CLASS SIGNUP POPULATIONS  */
    /************************************/
    if (_.isArray(classes) && classes[0] && classes[0].signups) {
      const classSignupManualPopulateFields = _.intersection(
        populateFields,
        VALID_CLASS_SIGNUP_MANUAL_POPULATE_FIELDS,
      );

      for (let i = 0; i < classSignupManualPopulateFields.length; i++) {
        const classSignupManualPopulateField = classSignupManualPopulateFields[i];

        const helper = sails.helpers.populate.classSignups[_.camelCase(classSignupManualPopulateField.substr(8))];

        await helper.with({
          classSignups: _.concat(...(_.map(classes, 'signups'))),
        });
      }
    }

    /*************************************************/
    /* MANUAL CLASS WAITING LIST SIGNUP POPULATIONS  */
    /*************************************************/
    if (_.isArray(classes) && classes[0] && classes[0].signups) {
      const classWaitingListSignupManualPopulateFields = _.intersection(
        populateFields,
        VALID_CLASS_WAITING_LIST_SIGNUP_MANUAL_POPULATE_FIELDS,
      );

      for (let i = 0; i < classWaitingListSignupManualPopulateFields.length; i++) {
        const classWaitingListSignupManualPopulateField = classWaitingListSignupManualPopulateFields[i];

        const helper = sails.helpers.populate.classWaitingListSignups[_.camelCase(classWaitingListSignupManualPopulateField.substr(21))];

        await helper.with({
          classWaitingListSignups: _.concat(...(_.map(classes, 'waiting_list_signups'))),
        });
      }
    }

    /*************************************************/
    /* MANUAL CLASS LIVESTREAM SIGNUP POPULATIONS  */
    /*************************************************/
    if (_.isArray(classes) && classes[0] && classes[0].signups) {
      const classLivestreamSignupManualPopulateFields = _.intersection(
        populateFields,
        VALID_CLASS_LIVESTREAM_SIGNUP_MANUAL_POPULATE_FIELDS,
      );

      for (let i = 0; i < classLivestreamSignupManualPopulateFields.length; i++) {
        const classLivestreamSignupManualPopulateField = classLivestreamSignupManualPopulateFields[i];

        const helper = sails.helpers.populate.classLivestreamSignups[_.camelCase(classLivestreamSignupManualPopulateField.substr(18))];

        await helper.with({
          classLivestreamSignups: _.concat(...(_.map(classes, 'livestream_signups'))),
        });
      }
    }


    /**************************/
    /* DONE                   */
    /**************************/
    let responseData = {
      responseType: 'classes',
      populate: _.concat(manualPopulateFields, eagerPopulateFields),
      classes: classes,
    };

    return exits.success(responseData);

  },

};
