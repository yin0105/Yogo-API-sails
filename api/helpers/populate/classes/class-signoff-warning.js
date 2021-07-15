const ClassSignupObjection = require('../../../objection-models/ClassSignup');
const ClassLivestreamSignupObjection = require('../../../objection-models/ClassLivestreamSignup');

module.exports = {
  friendlyName: 'Populate Class.class_signoff_warning',

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

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    if (typeof inputs.classes[0].class_signoff_warning !== 'undefined') {
      return exits.success(inputs.classes);
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.class_signoff_warning = null;
      });
      return exits.success(inputs.classes);
    }

    // We need Class.user_can_sign_off_from_class
    await sails.helpers.populate.classes.userCanSignOffFromClass(inputs.classes, inputs.user);
    await sails.helpers.populate.classes.userCanSignOffFromLivestream(inputs.classes, inputs.user);

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);
    const classesThatUserCanSignOffFrom = _.filter(
      inputs.classes,
      classItem => classItem.user_can_sign_off_from_class || classItem.user_can_sign_off_from_livestream,
    );

    const signups = await ClassSignupObjection
      .query()
      .from({cs: 'class_signup'})
      .where({
        user: userId,
        archived: false,
        cancelled_at: 0,
      })
      .andWhere('class', 'in', _.map(classesThatUserCanSignOffFrom, 'id'))
      .eager({
        used_class_pass: {
          class_pass_type: true,
        },
      });

    const livestreamSignups = await ClassLivestreamSignupObjection
      .query()
      .from({cls: 'class_livestream_signup'})
      .where({
        user: userId,
        archived: false,
        cancelled_at: 0,
      })
      .andWhere('class', 'in', _.map(classesThatUserCanSignOffFrom, 'id'))
      .eager({
        used_class_pass: {
          class_pass_type: true,
        },
      });

    const combinedSignups = _.concat(signups, livestreamSignups);
    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client);

    let {
      no_show_membership_fee_amount: membershipNoShowFee,
      no_show_time_based_class_pass_deduct_number_of_days: classPassUnlimitedNoShowDeductDays,
      no_show_fees_and_late_cancel_fees_are_different: noShowAndLateCancelFeesAreDifferent,
      late_cancel_membership_fee_amount: membershipLateCancelFee,
      late_cancel_time_based_class_pass_deduct_number_of_days: classPassUnlimitedLateCancelDeductDays,
    } = await sails.helpers.clientSettings.find(clientId, [
      'no_show_membership_fee_amount',
      'no_show_time_based_class_pass_deduct_number_of_days',
      'no_show_fees_and_late_cancel_fees_are_different',
      'late_cancel_membership_fee_amount',
      'late_cancel_time_based_class_pass_deduct_number_of_days',
    ]);

    membershipNoShowFee += ' kr';
    membershipLateCancelFee += ' kr';
    classPassUnlimitedNoShowDeductDays = sails.helpers.util.timeIntervalInHumanFormat(classPassUnlimitedNoShowDeductDays, 'day');
    classPassUnlimitedLateCancelDeductDays = sails.helpers.util.timeIntervalInHumanFormat(classPassUnlimitedLateCancelDeductDays, 'day');

    const private_class_signoff_deadline = await sails.helpers.clientSettings.find(clientId, 'private_class_signoff_deadline');
    const privateClassSignoffDeadlineInHumanFormat = sails.helpers.util.timeIntervalInHumanFormat(private_class_signoff_deadline, 'minutes');
    const regular_class_signoff_deadline = await sails.helpers.clientSettings.find(clientId, 'class_signoff_deadline');
    const regularClassSignoffDeadlineInHumanFormat = sails.helpers.util.timeIntervalInHumanFormat(regular_class_signoff_deadline, 'minutes');

    let privateClassWarningTextMembership,
      privateClassWarningTextClassPassUnlimited,
      regularClassWarningTextMembership,
      regularClassWarningTextClassPassUnlimited;

    if (noShowAndLateCancelFeesAreDifferent) {
      privateClassWarningTextMembership = sails.helpers.t(
        'classSignup.privateClassSignoffDeadlineHasBeenExceededWarningMembershipDifferentFees',
        [privateClassSignoffDeadlineInHumanFormat, membershipLateCancelFee, membershipNoShowFee],
      );
      privateClassWarningTextClassPassUnlimited = sails.helpers.t(
        'classSignup.privateClassSignoffDeadlineHasBeenExceededWarningUnlimitedClassPassDifferentFees',
        [privateClassSignoffDeadlineInHumanFormat, classPassUnlimitedLateCancelDeductDays, classPassUnlimitedNoShowDeductDays],
      );
      regularClassWarningTextMembership = sails.helpers.t(
        'classSignup.classSignoffDeadlineHasBeenExceededWarningMembershipDifferentFees',
        [regularClassSignoffDeadlineInHumanFormat, membershipLateCancelFee, membershipNoShowFee],
      );
      regularClassWarningTextClassPassUnlimited = sails.helpers.t(
        'classSignup.classSignoffDeadlineHasBeenExceededWarningUnlimitedClassPassDifferentFees',
        [regularClassSignoffDeadlineInHumanFormat, classPassUnlimitedLateCancelDeductDays, classPassUnlimitedNoShowDeductDays],
      );
    } else {
      privateClassWarningTextMembership = sails.helpers.t(
        'classSignup.privateClassSignoffDeadlineHasBeenExceededWarningMembership',
        [privateClassSignoffDeadlineInHumanFormat, membershipNoShowFee],
      );
      privateClassWarningTextClassPassUnlimited = sails.helpers.t(
        'classSignup.privateClassSignoffDeadlineHasBeenExceededWarningUnlimitedClassPass',
        [privateClassSignoffDeadlineInHumanFormat, classPassUnlimitedNoShowDeductDays],
      );
      regularClassWarningTextMembership = sails.helpers.t(
        'classSignup.classSignoffDeadlineHasBeenExceededWarningMembership',
        [regularClassSignoffDeadlineInHumanFormat, membershipNoShowFee],
      );
      regularClassWarningTextClassPassUnlimited = sails.helpers.t(
        'classSignup.classSignoffDeadlineHasBeenExceededWarningUnlimitedClassPass',
        [regularClassSignoffDeadlineInHumanFormat, classPassUnlimitedNoShowDeductDays],
      );
    }

    const privateClassWarningTextClassPassFixedCount = sails.helpers.t(
      'classSignup.privateClassSignoffDeadlineHasBeenExceededWarningFixedCountClassPass',
      privateClassSignoffDeadlineInHumanFormat,
    );
    const regularClassWarningTextClassPassFixedCount = sails.helpers.t(
      'classSignup.classSignoffDeadlineHasBeenExceededWarningFixedCountClassPass',
      regularClassSignoffDeadlineInHumanFormat,
    );


    for (let i = 0; i < inputs.classes.length; i++) {

      const cls = inputs.classes[i];

      if (cls.user_can_sign_off_from_class || cls.user_can_sign_off_from_livestream) {

        const signup = _.find(combinedSignups, ['class_id', cls.id]);
        // There will be a signup, otherwise
        // "cls.user_can_sign_off_from_class || cls.user_can_sign_off_from_livestream"
        // would not be true

        if (parseInt(cls.seats) === 1) {

          if (signup.used_membership_id) {
            cls.class_signoff_warning = privateClassWarningTextMembership;
          } else if (signup.used_class_pass && signup.used_class_pass.class_pass_type.pass_type === 'fixed_count') {
            cls.class_signoff_warning = privateClassWarningTextClassPassFixedCount;
          } else if (signup.used_class_pass && signup.used_class_pass.class_pass_type.pass_type === 'unlimited') {
            cls.class_signoff_warning = privateClassWarningTextClassPassUnlimited;
          } else {
            cls.class_signoff_warning = null;
          }

        } else {
          // Temporary code to find out why the signup sometimes is undefined
          if (!signup) {
            await sails.helpers.cron.log(`Signup does not exist for class ${cls.id} with user ${userId}. Why?`);
          }
          if (signup.used_membership_id) {
            cls.class_signoff_warning = regularClassWarningTextMembership;
          } else if (signup.used_class_pass && signup.used_class_pass.class_pass_type.pass_type === 'fixed_count') {
            cls.class_signoff_warning = regularClassWarningTextClassPassFixedCount;
          } else if (signup.used_class_pass && signup.used_class_pass.class_pass_type.pass_type === 'unlimited') {
            cls.class_signoff_warning = regularClassWarningTextClassPassUnlimited;
          } else {
            cls.class_signoff_warning = null;
          }
        }
      } else {
        cls.class_signoff_warning = null;
      }

    };

    return exits.success(inputs.classes);

  },
};
