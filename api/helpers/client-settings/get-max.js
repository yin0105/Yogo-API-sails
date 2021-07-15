const knex = require('../../services/knex');

module.exports = {

  friendlyName: 'Get client setting maximum across clients and including default value. Only for integers.',

  inputs: {
    key: {
      type: 'string',
      required: true,
    },

  },

  exits: {
    defaultIsNotInteger: {},
  },

  fn: async (inputs, exits) => {

    const settingDefinition = sails.helpers.clientSettings.getSchema()[inputs.key];

    if (settingDefinition.type !== 'integer') {
      throw 'defaultIsNotInteger';
    }

    const defaultValue = settingDefinition.defaultsTo;

    const settingsRows =
      await knex({cs: 'client_settings'})
        .innerJoin({c: 'client'}, 'cs.client', 'c.id')
        .where({
          key: inputs.key,
          'c.archived': 0,
        });

    const maxClientValue = _.chain(settingsRows)
      .map('value')
      .map(value => parseInt(value, 10))
      .max()
      .value();

    const maxValue = Math.max(
      defaultValue,
      maxClientValue || 0,
    );

    return exits.success(maxValue);
  },

};
