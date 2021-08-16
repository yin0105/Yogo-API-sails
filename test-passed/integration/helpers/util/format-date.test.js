const assert = require('assert')
const moment = require('moment-timezone')

describe('helpers.util.normalizeDate', function () {


  it('should format a date in English formats', () => {

    assert.strictEqual(
      sails.helpers.util.formatDate(moment.tz('2020-02-24', 'Europe/Copenhagen'), 'en'),
      'Monday, February 24, 2020',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'en',
        shortened: true,
      }),
      'Mon, Feb 24, 2020',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'en',
        includeWeekday: false,
      }),
      'February 24, 2020',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'en',
        includeYear: false,
      }),
      'Monday, February 24',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'en',
        includeWeekday: false,
        includeYear: false,
      }),
      'February 24',
    )

  })

  it('should format a date in Danish formats', () => {

    assert.strictEqual(
      sails.helpers.util.formatDate(moment.tz('2020-02-24', 'Europe/Copenhagen'), 'da'),
      'mandag d. 24. februar 2020',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'da',
        shortened: true,
      }),
      'man d. 24. feb 2020',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'da',
        includeWeekday: false,
      }),
      '24. februar 2020',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'da',
        includeYear: false,
      }),
      'mandag d. 24. februar',
    )

    assert.strictEqual(
      sails.helpers.util.formatDate.with({
        date: moment.tz('2020-02-24', 'Europe/Copenhagen'),
        locale: 'da',
        includeWeekday: false,
        includeYear: false,
      }),
      '24. februar',
    )

  })


})


