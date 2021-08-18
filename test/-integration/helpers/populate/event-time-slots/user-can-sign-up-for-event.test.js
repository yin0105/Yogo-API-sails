const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.event-time-slots.user-can-sign-up-for-event', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.eventTimeSlots.userCanSignUpForEvent([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if user_can_sign_up_for_event is already populated', async () => {

    const classes = [
      {
        user_can_sign_up_for_event: true
      },
      {
        user_can_sign_up_for_event: false
      }
    ]

    const result = await sails.helpers.populate.eventTimeSlots.userCanSignUpForEvent(classes)

    const expectedResult = [
      {
        user_can_sign_up_for_event: true
      },
      {
        user_can_sign_up_for_event: false
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
