const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.event-time-slots.user-is-signed-up-for-event', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.eventTimeSlots.userIsSignedUpForEvent([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if user_is_signed_up_for_event', async () => {

    const classes = [
      {
        user_is_signed_up_for_event: true
      },
      {
        user_is_signed_up_for_event: false
      }
    ]

    const result = await sails.helpers.populate.eventTimeSlots.userIsSignedUpForEvent(classes)

    const expectedResult = [
      {
        user_is_signed_up_for_event: true
      },
      {
        user_is_signed_up_for_event: false
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
