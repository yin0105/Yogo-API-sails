const ClassSignupObj = require('../../../objection-models/ClassSignup');
const ClassLivestreamSignupObj = require('../../../objection-models/ClassLivestreamSignup');

module.exports = {
  friendlyName: 'Email: Your class has been cancelled',

  inputs: {
    classSignup: {
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

    const signupId = sails.helpers.util.idOrObjectIdInteger(inputs.classSignup);

    const Model = inputs.signupType === 'studio_attendance'
      ? ClassSignupObj
      : ClassLivestreamSignupObj;

    const classSignup = await Model.query()
      .where('id', signupId)
      .eager({
        'class': {
          class_type: true,
        },
        client: true,
        user: true,
      })
      .first();

    let {
      locale,
      email_customer_your_class_has_been_cancelled_subject: subjectTemplate,
      email_customer_your_class_has_been_cancelled_body: textTemplate,
      email_bcc_to_client_on_class_cancelled: bccToClient,
    } = await sails.helpers.clientSettings.find(classSignup.client.id, [
        'locale',
        'email_customer_your_class_has_been_cancelled_subject',
        'email_customer_your_class_has_been_cancelled_body',
        'email_bcc_to_client_on_class_cancelled',
      ],
    );

    const [subject, text] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, textTemplate],
      {},
      {
        studio: classSignup.client,
        customer: classSignup.user,
        'class': classSignup.class,
      },
      locale,
    );

    await sails.helpers.email.send.with({
      user: classSignup.user,
      subject: subject,
      text: text,
      blindCopyToClient: bccToClient,
      emailType: 'your_class_has_been_cancelled',
    });

    return exits.success();

  },

};
