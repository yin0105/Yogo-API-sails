module.exports = {

  friendlyName: 'Reset password email',

  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
    setNewPasswordLink: {
      type: 'string',
      required: true,
    },
  },


  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);
    const user = await User.findOne(userId).populate('client');

    const token = await User.createAndReturnResetPasswordToken(user, 60 * 60 * 24); // 24 hours to reset password

    const link = inputs.setNewPasswordLink.replace('{email}', encodeURIComponent(user.email)).replace('{token}', token);

    let {
      email_customer_reset_password_subject: subjectTemplate,
      email_customer_reset_password_body: textTemplate,
    } = await sails.helpers.clientSettings.find(user.client, [
      'email_customer_reset_password_subject',
      'email_customer_reset_password_body',
    ]);

    const [subject, text] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, textTemplate],
      {
        link: link,
      },
      {
        studio: user.client,
        customer: user,
      },
    );

    await sails.helpers.email.send.with({
      user: user,
      subject: subject,
      text: text,
      emailType: 'password_reset'
    });

    return exits.success();

  },

};
