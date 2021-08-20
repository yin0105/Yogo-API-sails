const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.event-time-slots.event', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.eventTimeSlots.event([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if event is already populated', async () => {

    const classes = [
      {
        event: {}
      },
      {
        event: {}
      }
    ]

    const result = await sails.helpers.populate.eventTimeSlots.event(classes)

    const expectedResult = [
      {
        event: {}
      },
      {
        event: {}
      }
    ]

    assert.deepStrictEqual(
      result,
      expectedResult,
    )

    assert.deepStrictEqual(
      classes,
      expectedResult
    )
  })

})
