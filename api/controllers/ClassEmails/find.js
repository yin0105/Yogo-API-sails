const ObjectionClassEmail = require('../../objection-models/ClassEmail')
module.exports = {

  friendlyName: 'Find class email',

  inputs: {
    id: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    classEmailNotFound: {
      responseType: 'notFound',
    },
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassEmails.find', this.req, inputs)) {
      return exits.forbidden()
    }

    let classEmailIds = inputs.id

    if (!_.isArray(classEmailIds)) {
      classEmailIds = [classEmailIds]
    }

    const classEmailQuery = ObjectionClassEmail.query()
      .where('id', 'in', classEmailIds)
      .andWhere('archived', false)

    const classEmails = await classEmailQuery

    if (!classEmails || classEmails.length !== classEmailIds.length) {
      return exits.classEmailNotFound('E_CLASS_EMAIL_NOT_FOUND');
    }

    const response = _.isArray(inputs.id) ? classEmails : classEmails[0];

    return exits.success(response);

  },

};
