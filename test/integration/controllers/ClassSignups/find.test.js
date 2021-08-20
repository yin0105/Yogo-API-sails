const supertest = require('supertest')
const {authorize, stringifyQuery} = require('../../../utils/request-helpers')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')


describe('controllers.ClassSignups.find', () => {
  let request

  let branch1,
    branch2,
    room1,
    room2,
    class1,
    class2,
    class3,
    signupClass1UserA,
    signupClass2UserA,
    signupClass3UserA,
    signupClass3UserB,
    signupClass3UserC,
    signupClass3UserCArchived,
    signupClass3UserCCancelled,
    membershipUserA,
    classPassUserA

  before(async () => {
    request = supertest.agent(sails.hooks.http.app)

    branch1 = await Branch.create({
      client: testClientId,
      name: 'Branch 1',
    }).fetch()

    branch2 = await Branch.create({
      client: testClientId,
      name: 'Branch 2',
    }).fetch()

    room1 = await Room.create({
      client: testClientId,
      branch: branch1.id,
      name: 'Room 1',
    }).fetch()

    room2 = await Room.create({
      client: testClientId,
      branch: branch2.id,
      name: 'Room 2',
    }).fetch()

    class1 = await Class.create({
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      room: room1.id,
    }).fetch()

    class2 = await Class.create({
      date: '2018-05-16',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      room: room2.id,
    }).fetch()

    class3 = await Class.create({
      date: '2018-05-17',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
    }).fetch()


    membershipUserA = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch()

    classPassUserA = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
      client: testClientId,
    }).fetch()


    signupClass1UserA = await ClassSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_membership: membershipUserA.id,
      client: testClientId,
    }).fetch()

    signupClass2UserA = await ClassSignup.create({
      'class': class2.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPassUserA.id,
      client: testClientId,
    }).fetch()

    signupClass3UserA = await ClassSignup.create({
      'class': class3.id,
      user: fixtures.userAlice.id,
      client: testClientId,
    }).fetch()

    signupClass3UserB = await ClassSignup.create({
      'class': class3.id,
      user: fixtures.userBill.id,
      client: testClientId,
    }).fetch()

    signupClass3UserC = await ClassSignup.create({
      'class': class3.id,
      user: fixtures.userCharlie.id,
      client: testClientId,
    }).fetch()

    signupClass3UserCArchived = await ClassSignup.create({
      'class': class3.id,
      user: fixtures.userCharlie.id,
      client: testClientId,
      archived: true,
    }).fetch();

    signupClass3UserCCancelled = await ClassSignup.create({
      'class': class3.id,
      user: fixtures.userCharlie.id,
      client: testClientId,
      cancelled_at: Date.now(),
    }).fetch()


  })

  after(async () => {
    await Room.destroy({
      id: [room1.id, room2.id],
    })
    await Branch.destroy({
      id: [branch1.id, branch2.id],
    })
    await ClassSignup.destroy({
      id: _.map(
        [
          signupClass1UserA,
          signupClass2UserA,
          signupClass3UserA,
          signupClass3UserB,
          signupClass3UserC,
          signupClass3UserCArchived,
          signupClass3UserCCancelled
        ],
        'id',
      ),
    })
    await Class.destroy({
      id: _.map(
        [
          class1,
          class2,
          class3,
        ],
        'id',
      ),
    })

    await Membership.destroy({
      id: membershipUserA.id,
    })

    await ClassPass.destroy({
      id: classPassUserA.id,
    })
  })

  it('should return signups for a specific user in a specific timeframe', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/class-signups' +
        '?user=' + fixtures.userAlice.id +
        '&startDate=2018-05-16' +
        '&endDate=2018-05-16' +
        '&client=' + testClientId,
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)
      .expect(response => {
        const result = JSON.parse(response.text)
        compareDbCollection(
          result,
          [
            {
              id: signupClass2UserA.id,
            },
          ],
        )

      })


  })

  it('should return signups for a specific class when class is specified. Should exclude archived and cancelled signups.', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/class-signups' +
        '?class=' + class3.id +
        '&client=' + testClientId,
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)
      .expect(response => {
        let result = JSON.parse(response.text)
        result = _.sortBy(result, 'id')
        compareDbCollection(
          result,
          [
            {
              id: signupClass3UserA.id,
            },
            {
              id: signupClass3UserB.id,
            },
            {
              id: signupClass3UserC.id,
            },
          ],
        )
      })

  })

  it('should return signup populated with the specified sub fields', async () => {

    // No need to test all sub field combinations. There are (or will be) separate tests for the population helpers. Just make sure all the basic sub fields are populated.

    await supertest(sails.hooks.http.app)
      .get(
        '/class-signups' +
        '?user=' + fixtures.userAlice.id +
        '&startDate=2018-05-15' +
        '&endDate=2018-05-16' +
        '&client=' + testClientId +
        '&populate[]=user' +
        '&populate[]=class' +
        '&populate[]=used_membership' +
        '&populate[]=used_class_pass',
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)
      .expect(response => {
        let result = JSON.parse(response.text)
        result = _.sortBy(result, 'id')
        compareDbCollection(
          result,
          [
            {
              id: signupClass1UserA.id,
              user: {
                id: fixtures.userAlice.id,
              },
              class: {
                id: class1.id,
              },
              used_membership: {
                id: membershipUserA.id,
              },
            },
            {
              id: signupClass2UserA.id,
              user: {
                id: fixtures.userAlice.id,
              },
              class: {
                id: class2.id,
              },
              used_class_pass: {
                id: classPassUserA.id,
              },
            },
          ],
        )
      })


  })

  describe('populate', () => {
    describe('class.room', () => {
      it('should return nested rooms', async () => {
        await request
          .get('/class-signups')
          .query(
            stringifyQuery({
              user: fixtures.userAlice.id,
              client: testClientId,
              startDate: '2018-05-15',
              endDate: '2018-05-17',
              populate: ['class', 'class.room'],
            }),
          )
          .use(authorize(fixtures.userAliceAccessToken))
          .expect(200)
          .expect(response => {
            const rooms = _.chain(response.body)
              .map('class.room')
              .uniqBy('id')
              .value()

            rooms.sort((a, b) => {
              if (a == null) {
                return 1;
              } else if (b == null) {
                return -1
              } else {
                return a > b ? 1 : -1;
              }
            })

            expect(rooms).to.deep.equal([room1, room2, null])
          })

      })
    })
    describe('class.room.branch', () => {
      it('should return nested room branches', async () => {
        await request
          .get('/class-signups')
          .query(
            stringifyQuery({
              user: fixtures.userAlice.id,
              client: testClientId,
              startDate: '2018-05-15',
              endDate: '2018-05-17',
              populate: [
                'class',
                'class.room',
                'class.room.branch',
              ],
            }),
          )
          .use(authorize(fixtures.userAliceAccessToken))
          .expect(200)
          .expect(response => {
            const branches = _.chain(response.body)
              .map('class.room.branch')
              .compact()
              .value()

            expect(branches).to.deep.equal([branch1, branch2])
          })

      })
    })
  })


  it('should return a badRequest("User or class must be specified") if neither user nor class are specified, user admin', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/class-signups' +
        '?client=' + testClientId +
        '&populate[]=user',
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(400)
      .expect('"User or class must be specified"')
  })


  it('should return a badRequest("User or class must be specified") if neither user nor class are specified, user customer', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/class-signups' +
        '?client=' + testClientId +
        '&populate[]=user',
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(400)
      .expect('"User or class must be specified"')
  })


})
