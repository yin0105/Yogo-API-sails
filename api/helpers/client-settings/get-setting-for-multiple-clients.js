module.exports = {
  friendlyName: 'Get clients with setting',

  inputs: {
    clientIds: {
      type: 'json',
      required: true,
    },

    key: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    keyDoesNotExist: {},
  },

  fn: async (inputs, exits) => {

    const settingsSchema = sails.helpers.clientSettings.getSchema();

    if (!settingsSchema[inputs.key]) {
      return exits.keyDoesNotExist();
    }

    const clientSettingRows = await knex({cs: 'client_settings'})
      .where({
        key: inputs.key,
        archived: false,
      })
      .andWhere('client', 'in', inputs.clientIds)
      .select('client','value');

    const keyedClientsWithDbSettings = _.chain(clientSettingRows).keyBy( 'client').mapValues('value').value();

    const clientIdsWithDbSetting = _.map(clientSettingRows, 'client');
    const clientIdsWithDefaultValue = _.difference(inputs.clientIds, clientIdsWithDbSetting);

    if (clientIdsWithDefaultValue.length) {
      const defaultValue = settingsSchema[inputs.key].defaultsTo;
      const keyedClientsWithDefaultValue = _.zipObject(clientIdsWithDefaultValue, _.map(clientIdsWithDefaultValue, () => defaultValue));
      return exits.success({...keyedClientsWithDbSettings, ...keyedClientsWithDefaultValue});
    } else {
      return exits.success(keyedClientsWithDbSettings);
    }

  },
};
