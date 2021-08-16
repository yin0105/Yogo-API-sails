const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.event-time-slots.signup_count', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.eventTimeSlots.eventSignupCount([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })


  it('should populate events automatically if events are not already populated', async () => {

    const signups = await EventSignup.createEach([
      {
        event: fixtures.eventWithMultipleTimeSlots.id,
        user: fixtures.userAlice.id,
      },
      {
        event: fixtures.eventWithMultipleTimeSlots.id,
        user: fixtures.userBill.id,
      },
      {
        event: fixtures.eventWithOneTimeSlot.id,
        user: fixtures.userBill.id,
      },
    ]).fetch()

    const input = [
      {
        event: fixtures.eventWithMultipleTimeSlots.id,
      },
      {
        event: fixtures.eventWithOneTimeSlot.id,
      },
    ]

    await sails.helpers.populate.eventTimeSlots.eventSignupCount(input)

    comparePartialObject(
      input,
      [
        {
          event: {
            id: fixtures.eventWithMultipleTimeSlots.id,
            signup_count: 2
          }
        },
        {
          event: {
            id: fixtures.eventWithOneTimeSlot.id,
            signup_count: 1
          }
        }
      ]
    )

    await EventSignup.destroy({id: _.map(signups, 'id')})

  })


  it('should return the input array if signup_count is already populated', async () => {

    const timeSlots = [
      {
        event:
          {
            signup_count: 0,
          },
      },
      {
        event:
          {
            signup_count: 2,
          },
      },
    ]

    const workingCopy = _.cloneDeep(timeSlots)

    const returnedResult = await sails.helpers.populate.eventTimeSlots.eventSignupCount(workingCopy)

    assert.deepStrictEqual(
      returnedResult,
      timeSlots,
    )

    assert.deepStrictEqual(
      workingCopy,
      timeSlots,
    )

  })


})
