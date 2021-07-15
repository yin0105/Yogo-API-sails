const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const {authorizeUserBill, authorizeUserCharlie} = require('../../../utils/request-helpers')


describe('controllers.ClassWaitingListSignups.destroy', () => {

  let
    classTemplate,
    classItem,
    membershipUserA,
    membershipUserB,
    membershipUserC,
    signups,
    waitingListSignup

  before(async () => {
    classTemplate = {
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 2,
    }

    membershipUserA = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch()

    membershipUserB = await Membership.create({
      user: fixtures.userBill.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch()

    membershipUserC = await Membership.create({
      user: fixtures.userCharlie.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch()

  })

  after(async () => {

    await Membership.destroy({
      id: [membershipUserA.id, membershipUserB.id, membershipUserC.id],
    })

  })

  beforeEach(async () => {

    classItem = await Class.create(classTemplate).fetch() // 2018-05-15 10:00:00
    signups = await ClassSignup.createEach([
      {
        'class': classItem.id,
        user: fixtures.userAlice.id,
        used_membership: membershipUserA.id,
      },
      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
      },
    ]).fetch()

    waitingListSignup = await ClassWaitingListSignup.create({
      'class': classItem.id,
      user: fixtures.userCharlie.id,
      used_membership: membershipUserC.id,
    }).fetch()

    MockDate.set(moment.tz('2018-05-14 10:00:00', 'Europe/Copenhagen'))

  })


  afterEach(async () => {
    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await ClassSignup.destroy({id: _.map(signups, 'id')})
    await Class.destroy({id: classItem.id})
    MockDate.reset()
  })


  it('should archive a waiting list signup record in the database', async () => {

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-waiting-list-signups/' + waitingListSignup.id +
        '?client=' + testClientId,
      )
      .use(authorizeUserCharlie())
      .expect(200)

    const waitingListSignupInDb = await ClassWaitingListSignup.findOne(waitingListSignup.id)

    expect(waitingListSignupInDb).to.matchPattern(
      `{
        'class': ${classItem.id},
        user: ${fixtures.userCharlie.id},
        used_membership: ${membershipUserC.id},
        archived: false,
        cancelled_at: _.isGreaterThan|0,
        ...
      }`,
    )

  })

  it('should return 403 forbidden if user is not allowed to destroy signup', async () => {

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-waiting-list-signups/' + waitingListSignup.id +
        '?client=' + testClientId,
      )
      .use(authorizeUserBill())
      .expect(403)

  })

})
