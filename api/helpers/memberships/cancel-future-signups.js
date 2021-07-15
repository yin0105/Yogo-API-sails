
const MembershipObjection = require('../../objection-models/Membership');
const knex = require('../../services/knex');

module.exports = {
  friendlyName: 'Cancel future signups with membership',

  inputs: {
    membership: {
      type: 'ref',
      required: true,
    },
    userGetsRefundAfterDeadline: {
      type: 'boolean',
      required: true,
    },
    startDate: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
      required: true,
    },
    startTime: {
      type: 'string',
      custom: d => d.match(/^\d\d:\d\d:\d\d$/),
      defaultsTo: '00:00:00',
    },
    endDate: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
    onlyCancelSignupsWithoutAccess: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  fn: async (inputs, exits) => {

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);

    let membership, classTypeIds;

    if (inputs.onlyCancelSignupsWithoutAccess) {
      membership = await MembershipObjection.query()
        .where({id: membershipId})
        .first()
        .eager({
          membership_type: {
            class_types: true,
          },
        });
      classTypeIds = _.map(membership.membership_type.class_types, 'id');
    }


    const classSignupQuery = knex({cs: 'class_signup'})
      .innerJoin({c: 'class'}, 'cs.class', 'c.id')
      .select('cs.*')
      .where({
        'cs.archived': 0,
        'cs.cancelled_at': 0,
        'cs.used_membership': membershipId,
        'c.cancelled': 0,
      })
      .andWhere(
        dateQueryBuilder => dateQueryBuilder
          .where('c.date', '>', inputs.startDate)
          .orWhere(startDateQueryBuilder => startDateQueryBuilder
            .where('c.date', '=', inputs.startDate)
            .andWhere('c.start_time', '>=', inputs.startTime),
          ),
      );

    if (inputs.endDate) {
      classSignupQuery.andWhere('c.date','<=', inputs.endDate);
    }

    if (inputs.onlyCancelSignupsWithoutAccess) {
      classSignupQuery.whereNotIn('c.class_type', classTypeIds);
    }

    const classSignups = await classSignupQuery;

    await Promise.all(_.map(
      classSignups,
      classSignup => sails.helpers.classSignups.destroy(
        classSignup,
        inputs.userGetsRefundAfterDeadline,
      ),
    ));

    const classLivestreamSignupQuery = knex({cls: 'class_livestream_signup'})
      .innerJoin({c: 'class'}, 'cls.class', 'c.id')
      .select('cls.*')
      .where({
        'cls.archived': 0,
        'cls.cancelled_at': 0,
        'cls.used_membership': membershipId,
        'c.cancelled': 0,
      })
      .andWhere(
        dateQueryBuilder => dateQueryBuilder
          .where('c.date', '>', inputs.startDate)
          .orWhere(startDateQueryBuilder => startDateQueryBuilder
            .where('c.date', '=', inputs.startDate)
            .andWhere('c.start_time', '>=', inputs.startTime),
          ),
      );

    if (inputs.onlyCancelSignupsWithoutAccess) {
      classLivestreamSignupQuery.whereNotIn('c.class_type', classTypeIds);
    }

    const classLivestreamSignups = await classLivestreamSignupQuery;

    await Promise.all(_.map(
      classLivestreamSignups, classLivestreamSignup => sails.helpers.classLivestreamSignups.destroy(
        classLivestreamSignup,
        inputs.userGetsRefundAfterDeadline,
      ),
    ));

    const classWaitingListSignupQuery = knex({cwls: 'class_waiting_list_signup'})
      .innerJoin({c: 'class'}, 'cwls.class', 'c.id')
      .select('cwls.*')
      .where({
        'cwls.archived': 0,
        'cwls.cancelled_at': 0,
        'cwls.used_membership': membershipId,
        'c.cancelled': 0,
      })
      .andWhere(
        dateQueryBuilder => dateQueryBuilder
          .where('c.date', '>', inputs.startDate)
          .orWhere(startDateQueryBuilder => startDateQueryBuilder
            .where('c.date', '=', inputs.startDate)
            .andWhere('c.start_time', '>=', inputs.startTime),
          ),
      );

    if (inputs.onlyCancelSignupsWithoutAccess) {
      classWaitingListSignupQuery.whereNotIn('c.class_type', classTypeIds);
    }

    const classWaitingListSignups = await classWaitingListSignupQuery;

    await Promise.all(_.map(
      classWaitingListSignups, classWaitingListSignup => sails.helpers.classWaitingListSignups.destroy(
        classWaitingListSignup,
      ),
    ));

    return exits.success();

  },

};
