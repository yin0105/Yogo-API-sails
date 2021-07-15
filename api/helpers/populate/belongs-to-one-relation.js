/**
 *
 * UNDER CONSTRUCTION
 *
 */

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
  },

  fn: async (inputs, exits) => {
    if (!inputs.collection.length) {
      // Empty input collection
      return exits.success();
    }

    if (
      _.find(
        inputs.collection,
        item => item[inputs.relationName] && item[inputs.relationName].id,
      )
    ) {
      // Already populated
      return exits.success();
    }


    let idPropertyName = inputs.relationName;
    let relationIds = _.compact(_.map(inputs.collection, idPropertyName));
    if (!relationIds.length) {
      idPropertyName = inputs.relationName + '_id';
      relationIds = _.compact(_.map(inputs.collection, idPropertyName));
      if (!relationIds.length) {
        return exits.success(inputs.collection);
      }
    }

    const relations = await eval(inputs.modelName).find({
        id: relationIds,
      })
    ;

    for (let i = 0; i < inputs.collection.length; i++) {

      const item = inputs.collection[i];
      if (item[idPropertyName]) {
        if (idPropertyName === inputs.relationName) {
          item[inputs.relationName + '_id'] = item[inputs.relationName];
        }
        item[inputs.relationName] = _.find(relations, {id: item[idPropertyName]});
      } else {
        item[inputs.relationName] = null;
      }

    }

    return exits.success();
  },
};
