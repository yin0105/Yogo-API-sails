const assert = require('assert')
const moment = require('moment')

describe('helpers.util.normalizeDate', function () {


  it('should convert a Date object with any timezone to a moment.js object with Europe/Copenhagen timezone.', () => {

    const result = sails.helpers.util.normalizeDate(new Date(Date.UTC(2018, 11, 22, 14, 23, 5)))
    assert.strictEqual(
      result.format(),
      '2018-12-22T15:23:05+01:00',
    )

  })

  it('should convert a moment.js object with any timezone to a moment.js object with Europe/Copenhagen timezone.', () => {

    const result = sails.helpers.util.normalizeDate(moment.tz('2018-12-22 14:23:05', 'UTC'))
    assert.strictEqual(
      result.format(),
      '2018-12-22T15:23:05+01:00',
    )

  })

  it('should parse a YYYY-MM-DD date string as Europe/Copenhagen timezone and return a moment.js object.', () => {

    const result = sails.helpers.util.normalizeDate('2018-12-22')
    assert.strictEqual(
      result.format(),
      '2018-12-22T00:00:00+01:00',
    )

  })

  it('should parse a timestamp with miliseconds and return a moment.js object with Europe/Copenhagen timezone.', () => {

    const result = sails.helpers.util.normalizeDate(1583867856000)
    assert.strictEqual(
      result.format(),
      '2020-03-10T20:17:36+01:00',
    )

  })

  it('should parse a string with a timestamp with miliseconds and return a moment.js object with Europe/Copenhagen timezone.', () => {

    const result = sails.helpers.util.normalizeDate('1583867856000')
    assert.strictEqual(
      result.format(),
      '2020-03-10T20:17:36+01:00',
    )

  })

})


