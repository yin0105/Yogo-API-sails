module.exports = {
  friendlyName: 'Sign user up for event',

  inputs: {
    event: {
      type: 'ref',
      required: true
    },
    user: {
      type: 'ref',
      required: true
    }
  },

  fn: async (inputs, exits) => {

    const eventId = sails.helpers.util.idOrObjectIdInteger(inputs.event)
    const event = await Event.findOne(eventId);

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const eventSignup = await EventSignup.create({
      client: event.client,
      event: eventId,
      user: userId,
    }).fetch();

    if (event.send_email_to_customer) {
      await sails.helpers.email.customer.yourNewEvent(eventSignup)
    }

    return exits.success(eventSignup)

  }
}
