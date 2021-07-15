const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.event-time-slots.user-can-sign-off-from-event', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.eventTimeSlots.userCanSignOffFromEvent([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if user_can_sign_off_from_event is already populated', async () => {

    const classes = [
      {
        user_can_sign_off_from_event: true
      },
      {
        user_can_sign_off_from_event: false
      }
    ]

    const result = await sails.helpers.populate.eventTimeSlots.userCanSignOffFromEvent(classes)

    const expectedResult = [
      {
        user_can_sign_off_from_event: true
      },
      {
        user_can_sign_off_from_event: false
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
