const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.event-time-slots.event-has-started', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.eventTimeSlots.eventHasStarted([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if event_accepts_customer_signups is already populated', async () => {

    const classes = [
      {
        event_has_started: true
      },
      {
        event_has_started: false
      }
    ]

    const result = await sails.helpers.populate.eventTimeSlots.eventHasStarted(classes)

    const expectedResult = [
      {
        event_has_started: true
      },
      {
        event_has_started: false
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
