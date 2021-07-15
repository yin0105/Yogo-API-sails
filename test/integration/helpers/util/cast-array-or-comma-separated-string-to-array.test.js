const assert = require('assert')

describe('helpers.util.castArrayOrCommaSeparatedStringToArray', function () {

  it('should return an empty array when input is false-ish', () => {

    assert.deepEqual(
      sails.helpers.util.castArrayOrCommaSeparatedStringToArray(null),
      [],
    )

  })

  it('should return the original array if input is an array', () => {

    assert.deepEqual(
      sails.helpers.util.castArrayOrCommaSeparatedStringToArray([1,2]),
      [1,2],
    )

  })

  it('should convert a comma-separated list to array', () => {

    assert.deepEqual(
      sails.helpers.util.castArrayOrCommaSeparatedStringToArray("1,2,3"),
      ['1','2','3'],
    )

  })

})


