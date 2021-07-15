const sinon = require('sinon');

module.exports = {
  installEmailSendFake() {
    const emailSendFake = sinon.fake((options) => {
      if (
        !options.user
        && (
          !options.non_user_email
          || !options.client
        )
      ) {
        throw new Error('emailSendFake: User or email/name is required');
      }

      if (!options.subject) throw new Error('emailSendFake: Subject is required');
      if (!options.text) throw new Error('emailSendFake: Text is required');
      if (!options.emailType) throw new Error('emailSendFake: emailType is required');
    });
    sinon.replace(sails.helpers.email, 'send', emailSendFake);
    emailSendFake.with = emailSendFake;
    return emailSendFake;
  },
};
