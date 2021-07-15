module.exports = {
  frindlyName: 'Populate has-one relation',

  inputs: {
    collection: {
      type: 'ref',
      required: true,
    },
    relationName: {
      type: 'string',
      required: true,
    },
    modelName: {
      type: 'string',
      required: true,
    },
    viaRelationField: {
      type: 'string',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.collection.length) {
      return exits.success([]);
    }

    if (inputs.collection[0][inputs.relationName]) {
      // Already populated
      return exits.success(inputs.collection);
    }

    const collectionIds = _.map(inputs.collection, 'id');

    const relationModel = require(`../../objection-models/${inputs.modelName}`);

    const allRelations = await relationModel.query().where({archived: 0}).andWhere(inputs.viaRelationField, 'in', collectionIds);

    for (let i = 0; i < inputs.collection.length; i++) {
      const item = inputs.collection[i];
      item[inputs.relationName] = _.filter(allRelations, [inputs.viaRelationField, parseInt(item.id)]);
    }

    return exits.success();
  },
};
