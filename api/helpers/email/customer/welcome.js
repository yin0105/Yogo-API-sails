module.exports = {

  friendlyName: 'Send welcome email',

  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
    password: {
      type: 'string',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);
    const user = await User.findOne(userId).populate('client');

    let {
      email_welcome_subject: subjectTemplate,
      email_welcome_body: bodyTemplate,
    } = await sails.helpers.clientSettings.find(
      user.client, [
        'email_welcome_subject',
        'email_welcome_body',
      ]);

    const [subjectForLog, bodyForLog] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {},
      {
        customer: user,
        studio: user.client,
      },
    );

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectForLog, bodyForLog],
      {
        password: inputs.password,
        customer_password: inputs.password,
      },
    );

    await sails.helpers.email.send.with({
      user: user,
      subject: subject,
      subjectForLog: subjectForLog,
      text: body,
      textForLog: bodyForLog,
      emailType: 'welcome',
    });

    return exits.success();

  },

};
