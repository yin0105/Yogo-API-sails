const assert = require('assert')

describe('helpers.util.idOrObjectIdInteger', function () {


  it('should return input.id cast to integer if input is an object with id property.', () => {

    assert.strictEqual(
      sails.helpers.util.idOrObjectIdInteger({id: 4}),
      4,
    )

    assert.strictEqual(
      sails.helpers.util.idOrObjectIdInteger({id: "4"}),
      4,
    )


  })


  it('should return input cast to integer if input is NOT an object with id property.', () => {

    assert.strictEqual(
      sails.helpers.util.idOrObjectIdInteger(4),
      4,
    )

    assert.strictEqual(
      sails.helpers.util.idOrObjectIdInteger("4"),
      4,
    )

  })

})


