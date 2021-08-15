const supertest = require('supertest')
const qs = require('qs')
const assert = require('assert')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID

describe('models.Class.customToJson', async () => {

  let
    class1

  before(async () => {

    class1 = await Class.create({
      client: testClientId,
      date: '2018-05-20',
      start_time: '10:00:00',
      end_time: '12:00:00',
    }).fetch()

  })

  after(async () => {
    await Class.destroy({id: class1.id})
  })

  it('should remove seconds on start_time and end_time and send date in simple format', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-20',
      endDate: '2018-05-20',
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .expect(200)

    assert.deepEqual(
      _.pick(
        response.body.classes[0],
        ['date', 'start_time', 'end_time'],
      ),
      {
        date: '2018-05-20',
        start_time: '10:00',
        end_time: '12:00',
      },
    )
  })

})
