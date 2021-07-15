module.exports = {

  friendlyName: 'Create new class type email',

  inputs: {

    class_types: {
      type: 'json',
      required: true,
    },

    subject: {
      type: 'string',
      required: true,
    },

    body: {
      type: 'string',
      required: true,
    },

    send_at: {
      type: 'string',
      required: true,
    },

    send_to_signups: {
      type: 'boolean',
      required: true,
    },

    send_to_waiting_list: {
      type: 'boolean',
      required: true,
    },

    send_to_livestream_signups: {
      type: 'boolean',
      required: true,
    },

    minutes_before_class: {
      type: 'number',
    },

    send_to_subsequent_signups: {
      type: 'boolean',
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassTypeEmails.create', this.req)) {
      return exits.forbidden();
    }

    const logger = sails.helpers.logger('class-type-emails');

    logger.info('About to create class type email with subject "' + inputs.subject + '"');
    logger.info(inputs);


    const classTypeEmailData = _.pick(
      inputs,
      [
        'class_types',
        'subject',
        'body',
        'send_at',
        'send_to_signups',
        'send_to_livestream_signups',
        'send_to_waiting_list',
        'minutes_before_class',
        'send_to_subsequent_signups',
      ],
    );

    _.assign(classTypeEmailData, {
      client_id: this.req.client.id,
    });

    const classTypeEmail = await ClassTypeEmail.create(classTypeEmailData).fetch();

    logger.info('Class type email created.');

    return exits.success(classTypeEmail);

  },

};
