const knex = require('../../services/knex');

module.exports = {

  friendlyName: 'Delete class type email',

  exits: {
    classTypeEmailNotFound: {
      responseType: 'badRequest',
    },
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassTypeEmails.destroy', this.req)) {
      return exits.forbidden()
    }

    const logger = sails.helpers.logger('class-type-emails');

    logger.info('About to delete class type email, id ' + this.req.param('id'));

    const result = await knex('class_type_email')
      .where({
        id: this.req.param('id'),
      })
      .update({
        archived: 1,
      });

    if (result === 1) {
      logger.info('Deleted class type email, id ' + this.req.param('id'));
      return exits.success();
    } else {
      logger.info('Could not delete class type email, id ' + this.req.param('id') + '. Class email already deleted or mail has been sent.');
      return exits.success('E_COULD_NOT_DELETE_CLASS_EMAIL');
    }

  },

};
