const ClassSignupObj = require('../../../objection-models/ClassSignup');
const ClassLivestreamSignupObj = require('../../../objection-models/ClassLivestreamSignup');

module.exports = {

  friendlyName: 'SMS: Your class has been cancelled',

  inputs: {
    signup: {
      type: 'ref',
      required: true,
      description: 'Can be a regular signup or a livestream signup',
    },
    signupType: {
      type: 'string',
      isIn: ['studio_attendance', 'livestream'],
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const signupId = sails.helpers.util.idOrObjectIdInteger(inputs.signup);

    const Model = inputs.signupType === 'studio_attendance'
      ? ClassSignupObj
      : ClassLivestreamSignupObj;

    const signup = await Model.query()
      .where('id', signupId)
      .eager({
        class: {
          class_type: true,
        },
        client: true,
        user: true,
      })
      .first();


    const smsLogger = sails.helpers.logger('sms');
    smsLogger.info('Sms yourClassHasBeenCancelled, user: ' + signup.user.id);

    if (!signup.user.phone.match(/^\d{8}$/)) {
      smsLogger.error('Invalid phone number "' + signup.user.phone + '" for user "' + signup.user.first_name + ' ' + signup.user.last_name + '"');
      return exits.success();
    }

    const {
      sms_customer_your_class_has_been_cancelled_message: localizedMessageTemplate,
      locale,
    } = await sails.helpers.clientSettings.find(signup.client.id, [
      'sms_customer_your_class_has_been_cancelled_message',
      'locale',
    ]);


    const message = await sails.helpers.string.fillInVariables(
      localizedMessageTemplate,
      {},
      {
        customer: signup.user,
        studio: signup.client,
        class: signup.class,
      },
      locale,
    );

    await sails.helpers.sms.send.with({
      user: signup.user,
      message: message,
      type: 'class_cancelled',
    });

    return exits.success();

  },

};
