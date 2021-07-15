const ObjectionClassEmail = require('../../objection-models/ClassTypeEmail');

const VALID_MANUAL_POPULATE_FIELDS = [
  'class_types'
];

module.exports = {

  friendlyName: 'Find class type email',

  inputs: {
    id: {
      type: 'json',
    },
    populate: {
      type: 'json'
    }
  },

  exits: {
    classNotFound: {
      responseType: 'notFound',
    },
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassTypeEmails.find', this.req)) {
      return exits.forbidden()
    }

    const classTypeEmailQuery = ObjectionClassEmail.query()
      .where({
        client_id: this.req.client.id,
        archived: false,
      });

    let classTypeEmailIds = this.req.param('id') || inputs.id

    if (classTypeEmailIds) {
      if (!_.isArray(classTypeEmailIds)) {
        classTypeEmailIds = [classTypeEmailIds]
      }
      classTypeEmailQuery.where('id', 'in', classTypeEmailIds)
    }

    const eagerPopulateFields = _.intersection(
      inputs.populate,
      VALID_MANUAL_POPULATE_FIELDS
    );

    if (eagerPopulateFields.length) {
      classTypeEmailQuery.eager(
        sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields)
      )
    }

    const classTypeEmails = await classTypeEmailQuery

    if (
      classTypeEmailIds
      && classTypeEmailIds.length
      && classTypeEmailIds.length !== classTypeEmails.length
    ) {
      return exits.classNotFound('E_CLASS_TYPE_EMAIL_NOT_FOUND');
    }

    const response = this.req.path.match(/\/class-type-emails\/\d+/) ? classTypeEmails[0] : classTypeEmails

    return exits.success(response);

  },

};
