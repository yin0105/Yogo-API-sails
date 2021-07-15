const ClassPassObj = require('../../objection-models/ClassPass');

const VALID_EAGER_POPULATE_FIELDS = [
  'user',
  'log_entries',
  'class_pass_type',
  'class_pass_type.class_types',
];

module.exports = {
  friendlyName: 'Find class pass/class passes',

  inputs: {
    id: {
      type: 'number',
    },
    user: {
      type: 'number',
    },
    populate: {
      type: 'json',
    },

  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    badRequest: {
      responseType: 'badRequest',
    },
  },


  fn: async function (inputs, exits) {

    if (!inputs.id && !inputs.user) {
      return exits.badRequest('User or ID must be specified');
    }

    if (!await sails.helpers.can2('controller.ClassPasses.find', this.req, inputs)) {
      return exits.forbidden();
    }

    let classPassQuery = ClassPassObj.query()
      .where({
        client: this.req.client.id,
        archived: 0,
      });

    if (inputs.id) {
      classPassQuery.andWhere({id: inputs.id});
    } else {
      classPassQuery.andWhere({user: inputs.user});
    }

    let populateFields = _.intersection(
      inputs.populate,
      VALID_EAGER_POPULATE_FIELDS,
    );

    classPassQuery.eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(populateFields));

    let classPasses = await classPassQuery;

    if (inputs.id) {
      return exits.success(classPasses[0]);
    } else {
      return exits.success(classPasses);
    }

  },

};
