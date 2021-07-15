const ClassSignupObj = require('../../objection-models/ClassSignup');
const moment = require('moment-timezone');

module.exports = {

  friendlyName: 'Tick, apply no-show fees',

  description: 'Check if there are pending no-show fees that should be applied.',

  fn: async function (inputs, exits) {

    const logger = sails.helpers.logger('apply-no-show-fees');
    logger.info('Starting apply-no-show-fees');

    const clientIds = await sails.helpers.clientSettings.getClientsWithSetting('no_show_fees_enabled', true);

    const yesterday = moment.tz('Europe/Copenhagen').subtract(1, 'day').format('YYYY-MM-DD');

    const query = ClassSignupObj.query().alias('cs')
      .where('cs.client', 'in', clientIds)
      .innerJoin({c: 'class'}, 'cs.class', 'c.id')
      .where({
        'c.date': yesterday,
        'c.archived': 0,
        'c.cancelled': 0,
        'cs.archived': 0,
        'cs.cancelled_at': 0,
        'cs.checked_in': 0,
        'cs.no_show_fee_applied': 0,
      })
      .where(b => b.whereNotNull('cs.used_membership').orWhereNotNull('cs.used_class_pass'))
      .eager({
        client: true,
        class: {
          class_type: true,
        },
        used_class_pass: {
          class_pass_type: true,
        },
        used_membership: {
          membership_type: true,
        },
      });

    const classSignupsToPenalize = await query;

    const clientIdsToPenalize = _.chain(classSignupsToPenalize)
      .map('client_id')
      .uniq()
      .value();

    const noShowFeesApplyMethods = await sails.helpers.clientSettings.getSettingForMultipleClients(clientIdsToPenalize, 'no_show_fees_apply_method');

    for (let i = 0; i < classSignupsToPenalize.length; i++) {

      const classSignupToPenalize = classSignupsToPenalize[i];

      const applyFeeManually = noShowFeesApplyMethods[classSignupToPenalize.client_id] === 'manual';

      if (classSignupToPenalize.used_membership) {
        await sails.helpers.memberships.applyNoShowFee.with({
          signup: classSignupToPenalize,
          no_show_fee_cancelled: applyFeeManually,
          reason: 'no_show',
        });
      }

      if (classSignupToPenalize.used_class_pass) {
        if (classSignupToPenalize.used_class_pass.class_pass_type.pass_type === 'unlimited') {
          await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
            signup: classSignupToPenalize,
            no_show_fee_cancelled: applyFeeManually,
            reason: 'no_show',
          });
        } else {
          await sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
            signup: classSignupToPenalize,
            reason: 'no_show',
          });
        }
      }

    }

    return exits.success();

  },

};
