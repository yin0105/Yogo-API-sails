const MembershipObjectionObj = require('../../objection-models/Membership')
const moment = require('moment-timezone');

///////////////////////////////////////////////////////////////////////////
// When editing here, probably also need to edit user-has-access-to-livestream
///////////////////////////////////////////////////////////////////////////

module.exports = {

  friendlyName: 'Get valid memberships for livestream',

  description: 'Gets all valid memberships that a specific user has for livestream for a class, excluding the ones already used for the class.',

  inputs: {
    user: {
      type: 'ref',
      description: 'The user to get valid memberships for.',
      required: true,
    },

    classItem: {
      type: 'ref',
      description: 'The class to test the validity of the memberships against.',
      required: true,
    },
  },

  exits: {
    success: {},

    classNotFound: {
      description: 'Class was not found in the database.',
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const classItem = await Class.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.classItem),
    )
    if (!classItem || classItem.archived) {
      throw 'classNotFound'
    }

    let memberships = await MembershipObjectionObj.query().from({m: 'membership'})
      .where({
        user: userId,
        archived: false,
      })
      .andWhere(function () {
        this.where('status', 'active')
          .orWhere(function () {
            this.where('status', 'cancelled_running')
              .andWhere('cancelled_from_date', '>', classItem.date)
          })
      })
      .eager({
        membership_type: {
          class_types_livestream: true,
        },
        membership_pauses: true,
      })


    memberships = _.filter(
      memberships,
      membership => {
        let membershipTypeClassTypeIds = _.map(membership.membership_type.class_types_livestream, 'id')
        return _.includes(membershipTypeClassTypeIds, classItem.class_type)
      },
    )

    const existingSignupsForClass = await ClassLivestreamSignup.find({
      archived: false,
      cancelled_at: 0,
      user: userId,
      'class': classItem.id,
    })

    const alreadyUsedMembershipIds = _.compact(_.map(existingSignupsForClass, 'used_membership'))

    memberships = _.filter(memberships, membership => !_.includes(alreadyUsedMembershipIds, membership.id))

    ///////////////////////
    // Membership has max classes per week?
    ///////////////////////
    if (_.find(memberships, m => m.membership_type.has_max_number_of_classes_per_week)) {
      const mondayInSameWeekAsClass = moment(classItem.date).tz('Europe/Copenhagen').startOf('isoWeek')
      const sundayInSameWeekAsClass = moment(classItem.date).tz('Europe/Copenhagen').endOf('isoWeek')

      const signupsInSameWeekAsClass = await sails.helpers.classes.getSignupsInDateInterval(
        userId,
        mondayInSameWeekAsClass,
        sundayInSameWeekAsClass
      );

      _.each(
        memberships,
        (membership) => {
          if (!membership.membership_type.has_max_number_of_classes_per_week) return;

          const signupsWithMembershipInSameWeekAsClass = _.filter(
            signupsInSameWeekAsClass,
            {used_membership: membership.id}
          );

          if (signupsWithMembershipInSameWeekAsClass.length >= membership.membership_type.max_number_of_classes_per_week) {
            membership.should_be_removed = true
          }

        }
      )

      memberships = _.filter(memberships, membership => !membership.should_be_removed);

    }

    ///////////////////////
    // Membership has max number of simultaneous bookings
    ///////////////////////
    /*if (_.find(memberships, m => m.membership_type.has_max_number_of_simultaneous_bookings)) {

      const futureSignups = await sails.helpers.classes.getFutureSignups(userId);

      memberships = _.filter(
        memberships,
        (m) => {
          if (!m.membership_type.has_max_number_of_simultaneous_bookings) return true;
          const futureSignupsWithThisMembership = _.filter(
            futureSignups,
            {used_membership_id: m.id}
          )
          return futureSignupsWithThisMembership.length < m.membership_type.max_number_of_simultaneous_bookings
        }
      )

    }*/

    ///////////////////////
    // Membership has membership pause that overlaps the class
    ///////////////////////

    const classItemIsoDate = moment(classItem.date).format('YYYY-MM-DD');
    memberships = _.filter(
      memberships,
      m => {
        const membershipPause = _.sortBy(m.membership_pauses, 'start_date')[0];
        if (!membershipPause) return true;
        return classItemIsoDate < membershipPause.start_date
          || (
            membershipPause.end_date
            && classItemIsoDate >= membershipPause.end_date
          );
      },
    );

    return exits.success(
      memberships,
    )
  },

}
