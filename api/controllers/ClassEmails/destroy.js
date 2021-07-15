const knex = require('../../services/knex');

module.exports = {

  friendlyName: 'Delete class email',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    classNotFound: {
      responseType: 'badRequest',
    },
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassEmails.destroy', this.req, inputs)) {
      return exits.forbidden()
    }

    const logger = sails.helpers.logger('class-emails');

    logger.info('About to delete class email, id ' + inputs.id);

    const result = await knex('class_email')
      .where({
        id: inputs.id,
        email_sent: 0,
        now_processing: 0,
      })
      .update({
        archived: 1,
      });

    if (result === 1) {
      logger.info('Deleted class email, id ' + inputs.id);
      return exits.success();
    } else {
      logger.info('Could not delete class email, id ' + inputs.id + '. Class email already deleted or mail has been sent.');
      return exits.success('E_COULD_NOT_DELETE_CLASS_EMAIL');
    }

  },

};
