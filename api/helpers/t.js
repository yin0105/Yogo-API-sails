module.exports = {

  friendlyName: 'Translate',

  description: 'Translates the input string (or key) according to the locale files. Gets the locale from sails.req.getLocale(). Reason for this helper is that sails.__() apparently always uses the default locale when used outside of templates.',

  inputs: {
    key: {
      type: 'string',
      description: 'The input string/key',
      required: true,
    },
    params: {
      type: 'ref',
      description: 'Optional params to interpolate into string. Params as array replace %s. Params as an object replace {paramName}.',
      required: false,
    },
    locale: {
      type: 'string',
      required: false,
    },
  },

  sync: true,

  fn: (inputs, exits) => {
    const locale = inputs.locale
      || (
        (sails.yogo && sails.yogo.locale) ? sails.yogo.locale : 'en'
      );

    const translations = require('../../config/locales/' + locale + '.json');

    let translatedString = translations[inputs.key];

    if (!translatedString) throw new Error('Translation for key "' + inputs.key + '" does not exist for locale "' + locale + '"');

    if (!inputs.params) {
      return exits.success(translatedString);
    }

    if (_.isString(inputs.params) || _.isNumber(inputs.params)) {
      translatedString = translatedString.replace(/%s/g, inputs.params);
      return exits.success(translatedString);
    } else if (_.isArray(inputs.params)) {
      for (let i = 0; i < inputs.params.length; i++) {
        translatedString = translatedString.replace(/%s/, inputs.params[i]);
      }
      return exits.success(translatedString);
    } else if (_.isObject(inputs.params)) {
      _.each(inputs.params, (value, key) => {
        const regex = new RegExp('{' + key + '}', 'g');
        translatedString = translatedString.replace(regex, value);
      });
      return exits.success(translatedString);
    }

  },

};
