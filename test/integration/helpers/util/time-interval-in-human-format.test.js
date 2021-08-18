const assert = require('assert')

describe('helpers.util.time-interval-in-human-format', function () {

  it('should throw on invalid input', () => {

    const format = sails.helpers.util.timeIntervalInHumanFormat

    assert.throws(() => {
        format(1)
    })

    assert.throws(() => {
      format(1, 'second')
    })

    assert.throws(() => {
      format(1, 'second')
    })

  })

  it('should return the humanized time interval', () => {

    const format = sails.helpers.util.timeIntervalInHumanFormat

    assert.strictEqual(
      format(1, 'minute'),
      '1 minute'
    )

    assert.strictEqual(
      format(2, 'minute'),
      '2 minutes'
    )

    assert.strictEqual(
      format(1, 'hour'),
      '1 hour'
    )

    assert.strictEqual(
      format(2, 'hour'),
      '2 hours'
    )

    assert.strictEqual(
      format(1, 'day'),
      '1 day'
    )

    assert.strictEqual(
      format(2, 'day'),
      '2 days'
    )

    assert.strictEqual(
      format(60, 'minutes'),
      '1 hour'
    )

    assert.strictEqual(
      format(24, 'hours'),
      '1 day'
    )

    assert.strictEqual(
      format(90, 'minutes'),
      '1 hour and 30 minutes'
    )

    assert.strictEqual(
      format(27, 'hours'),
      '1 day and 3 hours'
    )

    assert.strictEqual(
      format(1441, 'minute'),
      '1 day and 1 minute'
    )

    assert.strictEqual(
      format(1570, 'minutes'),
      '1 day, 2 hours and 10 minutes'
    )

  })

})


