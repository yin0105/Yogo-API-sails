const MembershipObj = require('../../../objection-models/Membership');
const ClassPassObj = require('../../../objection-models/ClassPass');

const moment = require('moment-timezone');

///////////////////////////////////////////////////////////////////////////
// When editing here, probably also need to edit get-valid-membership-for-class
///////////////////////////////////////////////////////////////////////////

module.exports = {
  friendlyName: 'Populate Class.user_has_access_to_class',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
    user: {
      type: 'json',
      description: 'The current user',
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    const normalizeDate = sails.helpers.util.normalizeDate;

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    // Already populated??
    if (typeof inputs.classes[0].user_has_access_to_class !== 'undefined') {
      return exits.success(inputs.classes);
    }

    _.each(inputs.classes, cls => {
      cls.user_has_access_to_class = false;
    });

    // No user
    if (!inputs.user) {
      return exits.success(inputs.classes);
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);

    const classesSortedByDate = _.sortBy(inputs.classes, 'date');
    const earliestClassDate = sails.helpers.util.normalizeDate(classesSortedByDate[0].date);
    const latestClassDate = sails.helpers.util.normalizeDate(classesSortedByDate[classesSortedByDate.length - 1].date);


    const memberships = await MembershipObj.query().from({m: 'membership'})
      .where({
        user: userId,
        archived: false,
      })
      .andWhere('status', 'in', ['active', 'cancelled_running'])
      .eager({
        membership_type: {
          class_types: true,
        },
        membership_pauses: true,
      })
      .modifyEager('membership_pauses', q => q.where({archived: false}).orderBy('start_date','desc').limit(1));

    const classPasses = await ClassPassObj.query().from({cp: 'class_pass'})
      .where({
        user: userId,
      })
      .andWhere('cp.archived', false)
      .andWhere('valid_until', '>=', earliestClassDate.format('YYYY-MM-DD'))
      .innerJoin({cpt: 'class_pass_type'}, 'cp.class_pass_type', 'cpt.id')
      .andWhere(function () {
        this.where('cpt.pass_type', 'unlimited')
          .orWhere('cp.classes_left', '>', 0);
      })
      .eager({
        class_pass_type: {
          class_types: true,
        },
      });

    const membershipTypes = _.map(memberships, 'membership_type');
    const classPassTypes = _.map(classPasses, 'class_pass_type');

    let userSignedUpForClassesInRequestedPeriod = [],
      futureSignups = [];

    if (_.find(_.concat(membershipTypes, classPassTypes), accessItem => accessItem.has_max_number_of_classes_per_week)) {
      const mondayInEarliestWeek = moment(earliestClassDate).startOf('isoWeek');
      const sundayInLatestWeek = moment(latestClassDate).endOf('isoWeek');

      userSignedUpForClassesInRequestedPeriod = await sails.helpers.classes.getSignupsInDateInterval(
        inputs.user,
        mondayInEarliestWeek,
        sundayInLatestWeek,
      );
    }

    if (_.find(_.concat(membershipTypes, classPassTypes), accessItem => accessItem.has_max_number_of_simultaneous_bookings)) {
      futureSignups = await sails.helpers.classes.getFutureClassAndWaitingListSignups(userId);
    }

    _.each(inputs.classes, classItem => {

      const mondayInSameWeekAsClass = normalizeDate(classItem.date).startOf('isoWeek');
      const sundayInSameWeekAsClass = normalizeDate(classItem.date).endOf('isoWeek');

      const signupsInSameWeekAsClass = _.filter(userSignedUpForClassesInRequestedPeriod, signedUpForClass => {
        const signedUpForClassMomentObject = normalizeDate(signedUpForClass.date);
        return signedUpForClassMomentObject.isSameOrAfter(mondayInSameWeekAsClass, 'day') &&
          signedUpForClassMomentObject.isSameOrBefore(sundayInSameWeekAsClass, 'day');
      });

      const classItemClassTypeId = classItem.class_type_id || sails.helpers.util.idOrObjectIdInteger(classItem.class_type);

      _.each(memberships, membership => {

        if (membership.membership_type.has_max_number_of_simultaneous_bookings) {
          const futureSignupsWithThisMembership = _.filter(
            futureSignups,
            {used_membership_id: membership.id},
          );
          if (futureSignupsWithThisMembership.length >= membership.membership_type.max_number_of_simultaneous_bookings) {
            return;
          }
        }

        if (membership.membership_type.has_max_number_of_classes_per_week) {
          const signupsInSameWeekWithThisMembershipUsed = _.filter(signupsInSameWeekAsClass, signup => {
            return parseInt(signup.used_membership) === parseInt(membership.id);
          });
          if (signupsInSameWeekWithThisMembershipUsed.length >= membership.membership_type.max_number_of_classes_per_week) return;
        }

        const membershipClassTypeIds = _.map(membership.membership_type.class_types, 'id');
        if (!_.includes(membershipClassTypeIds, classItemClassTypeId)) return;

        const membershipPause = membership.membership_pauses[0]; // Latest pause
        const classItemIsoDate = sails.helpers.util.normalizeDate(classItem.date).format('YYYY-MM-DD')
        if (
          membershipPause
          && membershipPause.start_date <= classItemIsoDate
          && (
            !membershipPause.end_date
            || membershipPause.end_date > classItemIsoDate
          )
        ) {
          return;
        }

        switch (membership.status) {
          case 'active':
            classItem.user_has_access_to_class = true;
            return false;
          case 'cancelled_running':
            if (normalizeDate(membership.cancelled_from_date).isSameOrBefore(normalizeDate(classItem.date))) return;
            classItem.user_has_access_to_class = true;
            return false;
        }

      });

      if (classItem.user_has_access_to_class) {
        return;
      }

      _.each(classPasses, classPass => {

        if (classPass.class_pass_type.has_max_number_of_simultaneous_bookings) {
          const futureSignupsWithThisClassPass = _.filter(
            futureSignups,
            {used_class_pass_id: classPass.id},
          );
          if (futureSignupsWithThisClassPass.length >= classPass.class_pass_type.max_number_of_simultaneous_bookings) {
            return;
          }
        }

        const classPassClassTypeIds = _.map(classPass.class_pass_type.class_types, 'id');

        if (!_.includes(classPassClassTypeIds, classItemClassTypeId)) return;

        if (normalizeDate(classPass.valid_until).isBefore(normalizeDate(classItem.date), 'day')) return;

        classItem.user_has_access_to_class = true;
        return false;

      });

    });

    return exits.success(inputs.classes);

  },
};
