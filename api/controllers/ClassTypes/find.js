const ClassTypeObjection = require('../../objection-models/ClassType');
const knex = require('../../services/knex');

module.exports = {
  friendlyName: 'Find class type(s)',

  inputs: {
    id: {
      type: 'ref',
      custom: id => Number.isInteger(id * 1) || id.every(n => Number.isInteger(n * 1)),
    },
    hasClassesFromDateForward: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
    populate: {
      type: 'ref',
    },
  },

  fn: async function (inputs, exits) {

    const query = ClassTypeObjection.query()
      .where({
        client: this.req.client.id,
        archived: 0,
      });

    if (inputs.id) {
      query.andWhere(
        'id',
        'in',
        _.isArray(inputs.id) ? inputs.id : [inputs.id],
      );
    }

    if (inputs.hasClassesFromDateForward) {

      const classTypesWithClassesFromDateForward = await knex({ct: 'class_type'})
        .innerJoin({c: 'class'}, 'ct.id', 'c.class_type')
        .select('ct.id')
        .where({
          'c.client': this.req.client.id,
          'c.archived': 0,
        })
        .andWhere('c.date', '>=', inputs.hasClassesFromDateForward)
        .groupBy('ct.id');

      query.andWhere('id', 'in', _.map(classTypesWithClassesFromDateForward, 'id'));

    }

    const populateFields = _.intersection(inputs.populate, [
      'image',
      'class_pass_types',
      'membership_types',
      'class_pass_types_livestream',
      'membership_types_livestream',
      'class_type_emails',
    ]);

    query.eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(populateFields));

    query.modifyEager('class_pass_types', builder => builder.where({'class_pass_type.archived': 0}));
    query.modifyEager('membership_types', builder => builder.where({'membership_type.archived': 0}));
    query.modifyEager('class_pass_types_livestream', builder => builder.where({'class_pass_type.archived': 0}));
    query.modifyEager('membership_types_livestream', builder => builder.where({'membership_type.archived': 0}));
    query.modifyEager('class_type_emails', builder => builder.where({'class_type_email.archived': 0}));

    const classTypes = await query;

    return exits.success(
      inputs.id && !_.isArray(inputs.id)
        ? classTypes[0]
        : classTypes,
    );

  },
};
