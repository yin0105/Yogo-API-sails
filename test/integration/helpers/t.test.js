const assert = require('assert');

describe('t (translate)', () => {

  it('should throw an error if key does not exist', () => {
    assert.throws(() => {
        sails.helpers.t('test.keyDoesNotExist');
      },
      Error,
      'Translation for key ".test.keyDoesNotExist" does not exist for locale "da"',
    );
  });

  it('should return the translated string for a key without parameters', () => {
    const translation = sails.helpers.t('test.testStringWithLocale');

    assert.equal(
      translation,
      'Test string - en',
    );
  });

  it('should read local from sails.yogo.locale if set', () => {

    sails.yogo = {
      locale: 'da',
    };

    const translation = sails.helpers.t('test.testStringWithLocale');

    assert.equal(
      translation,
      'Teststreng - da',
    );

    delete sails.yogo;

  });

  it('should return the translated string for a key with one parameter', () => {
    const translation = sails.helpers.t('test.testStringWithOneParameter', 'Red');

    assert.equal(
      translation,
      'A Red B',
    );
  });

  it('should return the translated string for a key with multiple unnamed parameters', () => {
    const translation = sails.helpers.t('test.testStringWithMultipleParameters', ['Red', 'Blue', 'Green']);

    assert.equal(
      translation,
      'A Red B Blue C Green D',
    );
  });

  it('should return the translated string for a key with multiple named parameters', () => {
    const translation = sails.helpers.t('test.testStringWithMultipleNamedParameters', {a: 'Red', b: 'Blue', c: 'Green'});

    assert.equal(
      translation,
      'A Red B {bb} C Green D',
    );
  });

  it('should have identical keys in all translation files', () => {
    const locales = sails.config.i18n.locales;
    const english = require('../../../config/locales/en.json');
    const englishKeys = _.keys(english);

    _.each(locales, locale => {
      if (locale === 'en') return true;
      const completeTranslation = require('../../../config/locales/' + locale + '.json');
      const keys = _.keys(completeTranslation);
      const missingKeys = _.difference(englishKeys, keys);
      const additionalKeys = _.difference(keys, englishKeys);
      if (
        missingKeys.length || additionalKeys.length
      ) {
        assert.fail(
          keys,
          englishKeys,
          'Translation keys for locale "' + locale + '" differ from English translation keys.',
        );
      }
    });
  });

});
