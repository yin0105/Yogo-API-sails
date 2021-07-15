const ObjectionClassWaitingListSignup = require('../../../objection-models/ClassWaitingListSignup');

module.exports = {

  friendlyName: 'Sms: Customer waiting list signup converted to class signup',

  inputs: {
    waitingListSignup: {
      type: 'ref',
      description: 'The waiting list signup',
      required: true,
    },
  },


  fn: async (inputs, exits) => {

    const smsLogger = sails.helpers.logger('sms');

    const waitingListSignupId = sails.helpers.util.idOrObjectIdInteger(inputs.waitingListSignup);

    smsLogger.info('class-waiting-list-signup-converted-to-class-signup, waitingListSignupId: ' + waitingListSignupId);

    const waitingListSignup = await ObjectionClassWaitingListSignup.query()
      .where('id', waitingListSignupId)
      .eager({
        user: true,
        'class': {
          class_type: true,
        },
        client: true,
      })
      .first();

    if (!waitingListSignup.user.phone) {
      smsLogger.info('User ' + waitingListSignup.user.id + ', ' + waitingListSignup.user.first_name + ' ' + waitingListSignup.user.last_name + ' has no phone number. Skipping sms notification about getting seat on class ' + waitingListSignup.class.id);
      return exits.success();
    }

    const {
      sms_class_waiting_list_customer_moved_from_waiting_list_to_signup: smsMessageTemplate,
      locale,
    } = await sails.helpers.clientSettings.find(
      waitingListSignup.client.id,
      [
        'sms_class_waiting_list_customer_moved_from_waiting_list_to_signup',
        'locale',
      ],
    );

    const smsMessage = await sails.helpers.string.fillInVariables(
      smsMessageTemplate,
      {},
      {
        customer: waitingListSignup.user,
        studio: waitingListSignup.client,
        'class': waitingListSignup.class,
      },
      locale,
    );

    await sails.helpers.sms.send.with({
      user: waitingListSignup.user,
      message: smsMessage,
      type: 'customer_moved_from_waiting_list_to_class',
    });

    return exits.success();

  },

};
