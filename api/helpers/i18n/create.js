const i18n = require('i18n-2');
const path = require('path');

module.exports = {
  friendlyName: 'Create new i18n instance',

  inputs: {
    locale: {
      type: 'string',
    },
  },

  sync: true,

  fn: (inputs, exits) => {

    const i18nInstance = new i18n({
      locales: sails.config.i18n.locales,
      defaultLocale: 'en',

      extension: '.json',
      directory: path.join(__dirname, '../../../config/locales'),

    });

    if (inputs.locale) {
      i18nInstance.setLocale(inputs.locale);
    }

    return exits.success(i18nInstance);

  },
};
