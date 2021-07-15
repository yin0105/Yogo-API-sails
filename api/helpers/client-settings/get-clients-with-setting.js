module.exports = {
  friendlyName: 'Get clients with setting',

  inputs: {
    key: {
      type: 'string',
      required: true
    },

    value: {
      type: 'json',
      required: true
    }
  },

  exits: {
    keyDoesNotExist: {}
  },

  fn: async (inputs, exits) => {

    const settingsSchema = sails.helpers.clientSettings.getSchema();

    if (!settingsSchema[inputs.key]) {
      return exits.keyDoesNotExist();
    }

    const clientSettingRows = await ClientSettings.find({
      key: inputs.key,
      archived: false
    });

    const dbValue = typeof inputs.value === 'boolean' ? (inputs.value ? '1' : '0') : inputs.value;
    const clientSettingsRowsWithCorrectValue = _.filter(clientSettingRows, {value: dbValue});
    const clientIdsWithCorrectRowSetting = _.map(clientSettingsRowsWithCorrectValue, 'client');

    const defaultValue = settingsSchema[inputs.key].defaultsTo;
    if (defaultValue === inputs.value) {
      const activeClientIds = _.map(
        await Client.find({archived: false}),
        'id'
      );
      const allClientIdsWithRowSetting = _.map(clientSettingRows, 'client');
      const clientIdsWithCorrentDefaultValue = _.difference(
        activeClientIds,
        allClientIdsWithRowSetting
      );
      return exits.success([...clientIdsWithCorrectRowSetting, ...clientIdsWithCorrentDefaultValue]);
    } else {
      return exits.success(clientIdsWithCorrectRowSetting);
    }

  }
}
