const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures


describe('controllers.Events.find', () => {

  it('should return events for the current client', async () => {

    const {body: events} = await supertest(sails.hooks.http.app)
      .get(
        '/events' +
        '?client=' + testClientId,
      )
      //.set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const sortedEvents = _.sortBy(events, 'id');

    expect(sortedEvents).to.matchPattern(`
      [
        {
          id: ${fixtures.eventWithoutTimeSlots.id},
          ...
        },
        {
          id: ${fixtures.eventWithOneTimeSlot.id},
          ...
        },
        {
          id: ${fixtures.eventWithMultipleTimeSlots.id},
          ...
        }
      ]`
    );

  })

})
