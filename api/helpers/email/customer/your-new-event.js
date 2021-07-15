module.exports = {
  friendlyName: '"You new event" email',

  inputs: {
    eventSignup: {
      type: 'ref',
      required: true
    }
  },

  fn: async (inputs, exits) => {

    const eventSignupId = sails.helpers.util.idOrObjectIdInteger(inputs.eventSignup)

    const eventSignup = await EventSignup.findOne(eventSignupId).populate('user').populate('client').populate('event');

    const bodyTemplate = eventSignup.event.email_body;
    const subjectTemplate = eventSignup.event.email_subject;

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {},
      {
        customer: eventSignup.user,
        studio: eventSignup.client,
      }
    )

    // SEND THE EMAIL
    await sails.helpers.email.send.with({
      user: eventSignup.user,
      subject: subject,
      text: body,
      emailType: 'your_new_event'
    });

    return exits.success()

  }
}
