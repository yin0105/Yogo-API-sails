module.exports = {

  friendlyName: 'Update class type email',

  inputs: {
    class_types: {
      type: 'json',
    },

    subject: {
      type: 'string',
    },

    body: {
      type: 'string',
    },

    send_at: {
      type: 'string',
    },

    send_to_signups: {
      type: 'boolean',
    },

    send_to_livestream_signups: {
      type: 'boolean',
    },

    send_to_waiting_list: {
      type: 'boolean',
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
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {

    console.log()

    if (!await sails.helpers.can2('controller.ClassTypeEmails.update', this.req)) {
      return exits.forbidden()
    }

    const logger = sails.helpers.logger('class-type-emails');

    logger.info('About to update class type email, id ' + this.req.param('id'));
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

    logger.info('Updating with data:', classTypeEmailData);

    const [classTypeEmail] = await ClassTypeEmail.update({id: this.req.param('id')}, classTypeEmailData).fetch();

    logger.info('Email updated.');

    return exits.success(classTypeEmail);

  },

};
