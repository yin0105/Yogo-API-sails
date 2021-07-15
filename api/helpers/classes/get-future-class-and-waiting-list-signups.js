const ClassSignupObj = require('../../objection-models/ClassSignup');
const ClassWaitingListSignupObj = require('../../objection-models/ClassWaitingListSignup');

const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Get future signups for user',

  description: 'Get all types of future signups for user',

  inputs: {
    user: {
      type: 'ref',
      required: true
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);

    const now = moment.tz('Europe/Copenhagen');
    const currentDate = now.format('YYYY-MM-DD');
    const currentTime = now.format('HH:mm:ss');
    const futureAttendanceClassSignups = await ClassSignupObj.query().alias('cs')
      .innerJoin({c: 'class'}, 'cs.class', 'c.id')
      .where('cs.user', userId)
      .andWhere('cs.archived', false)
      .andWhere('cs.cancelled_at', 0)
      .andWhere('c.archived', false)
      .andWhere('c.cancelled', false)
      .andWhere(function () {
        this.where('c.date', '>', currentDate)
          .orWhere(qb => {
            qb.where('c.date', currentDate)
              .andWhere('c.start_time', '>', currentTime);
          });
      })
      .eager({
        used_membership: true,
        used_class_pass: true,
      });

    /*const futureLivestreamSignups = await ClassLivestreamSignupObj.query().alias('cls')
      .innerJoin({c: 'class'}, 'cls.class', 'c.id')
      .where('cls.user', userId)
      .andWhere('cls.archived', false)
      .andWhere('cls.cancelled_at', 0)
      .andWhere('c.archived', false)
      .andWhere('c.cancelled', false)
      .andWhere(function () {
        this.where('c.date', '>', currentDate)
          .orWhere(qb => {
            qb.where('c.date', currentDate)
              .andWhere('c.start_time', '>', currentTime);
          });
      })
      .eager({
        used_membership: true,
        used_class_pass: true,
      });*/

    const futureWaitingListSignups = await ClassWaitingListSignupObj.query().alias('cwls')
      .innerJoin({c: 'class'}, 'cwls.class', 'c.id')
      .where('cwls.user', userId)
      .andWhere('cwls.archived', false)
      .andWhere('cwls.cancelled_at', 0)
      .andWhere('c.archived', false)
      .andWhere('c.cancelled', false)
      .andWhere(function () {
        this.where('c.date', '>', currentDate)
          .orWhere(qb => {
            qb.where('c.date', currentDate)
              .andWhere('c.start_time', '>', currentTime);
          });
      })
      .eager({
        used_membership: true,
        used_class_pass: true,
      });

    const futureSignups = _.concat(
      futureAttendanceClassSignups,
      //futureLivestreamSignups,
      futureWaitingListSignups
    )

    return exits.success(futureSignups);
  }
}
