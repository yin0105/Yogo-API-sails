const supertest = require('supertest')
const qs = require('qs')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')

const {authorizeAdmin, authorizeUserAlice} = require('../../../../utils/request-helpers')

describe('userIsSignedUp', () => {

  let
    class1Private,
    class2Regular,
    class3Regular,
    class4Open,
    signups

  before(async () => {


    class1Private = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-11',
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 1,
      teachers: [fixtures.userBill.id, fixtures.userCharlie.id],
      room: fixtures.testClientRoomA1.id,
    }).fetch()


    class2Regular = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeDance.id,
      date: '2018-05-16',
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userBill.id],
      seats: 20,
      room: fixtures.testClientRoomA1.id,
    }).fetch()

    class3Regular = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeDance.id,
      date: '2018-05-17',
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userBill.id],
      seats: 20,
      room: fixtures.testClientRoomA1.id,
    }).fetch()

    class4Open = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-17',
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userBill.id],
      seats: 0,
      room: fixtures.testClientRoomA1.id,
    }).fetch()

    signups = [
      await ClassSignup.create({
        'class': class2Regular.id,
        user: fixtures.userAlice.id,
      }).fetch(),
      await ClassSignup.create({
        'class': class3Regular.id,
        user: fixtures.userBill.id,
      }).fetch(),
    ]

  })

  after(async () => {
    await Class.destroy({
      id: [
        class1Private.id,
        class2Regular.id,
        class3Regular.id,
        class4Open.id,
      ],
    })

    await ClassSignup.destroy({id: _.map(signups, 'id')})

  })


  it('should throw if not logged in', async () => {
    let query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      userIsSignedUp: fixtures.userAlice.id,
    })

    await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .expect(400)
  })

  it('should return only classes that the current user is signed up for', async () => {

    let query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      userIsSignedUp: fixtures.userAlice.id,
    })

    let response = await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .use(authorizeUserAlice())
      .expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {
          id: class2Regular.id,
        },
      ],
    )

  })

  it('should return only classes that the specified user is signed up for, if current user is admin', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      userIsSignedUp: fixtures.userAlice.id,
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .use(authorizeAdmin())
      .expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {
          id: class2Regular.id,
        },
      ],
    )

  })

})
