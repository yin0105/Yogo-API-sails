const supertest = require('supertest')
const qs = require('qs')
const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')
const MockDate = require('mockdate')
const moment = require('moment-timezone')

const {authorizeAdmin} = require('../../../../utils/request-helpers')

describe('populate eager fields', () => {

  let
    class1,
    class2,
    signups,
    membership

  before(async () => {

    MockDate.set(moment.tz('2018-05-13', 'Europe/Copenhagen'))

    class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-11',
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 20,
      teachers: [fixtures.userBill.id, fixtures.userCharlie.id],
      room: fixtures.testClientRoomA1.id
    }).fetch()
    class1.class_type_id = fixtures.classTypeYoga.id


    class2 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeDance.id,
      date: '2018-05-16',
      start_time: '14:00:00',
      end_time: '16:00:00',
      seats: 20,
    }).fetch()
    class2.class_type_id = fixtures.classTypeDance.id

    membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2018-05-30',
      archived: false,
    }).fetch()

    signups = await ClassSignup.createEach([
      {
        'class': class1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
    ]).fetch()

  })

  after(async () => {
    await Class.destroy({
      id: [
        class1.id,
        class2.id,
      ],
    })
    await Membership.destroy({id: membership.id})
    await ClassSignup.destroy({id: _.map(signups, 'id')})

    MockDate.reset()
  })

  it ('should return an error for invalid populate fields', async () => {
    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: [
        'xxxx',
        'room',
        'room.branch',
        'class_type',
        'class_type.image',
        'teachers',
        'teachers.image',
        'signups',
        'signups.user',
        'signups.user.image',
        'signups.used_membership',
        'signups.used_membership.real_user_image',
        'location', // Deprecated but should not give error
        'signup_count' // Deprecated but should not give an error
      ],
    })

    await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(400)
      .expect('"The following populate fields are invalid: xxxx"')

  })

  it('should populate all eager fields', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: [
        'room',
        'room.branch',
        'class_type',
        'class_type.image',
        'teachers',
        'teachers.image',
        'signups',
        'signups.user',
        'signups.user.image',
        'signups.used_membership',
        'signups.used_membership.real_user_image',
        'location',
        'signup_count'
      ],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    expect(response.body.classes).to.matchPattern(`
      [
        {
          room: {
            id: ${fixtures.testClientRoomA1.id},
            branch: {
              id: ${fixtures.testClientBranchA.id},
              ...
            },
            ...
          },
          class_type: {
            image: {id: ${fixtures.image1.id}, ...},
            id: ${fixtures.classTypeYoga.id},
            ...
          },
          teachers: [
            {
              id: ${fixtures.userBill.id},
              image: null,
              ...
            },
            {
              id: ${fixtures.userCharlie.id},
              ...
            },
          ],
          signups: [
            {
              user: {
                image: null,
                id: ${fixtures.userAlice.id},
                ...
              },
              used_membership: {
                id: ${membership.id},
                ...
              },
              ...
            },
          ],
          signup_count: 1,          
          ...
        },
        {
          id: ${class2.id},
          ...
        },
      ]`
    )

  })

  it('should not populate teacher address, email, etc, if user is not admin', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: [
        'teachers',
        'teachers.image',
      ],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {

          teachers: [
            {
              id: fixtures.userBill.id,
              image: null
            },
            {
              id: fixtures.userCharlie.id,
            },
          ],
        },
        {
          id: class2.id,
        },
      ],
    )

    const teachers = response.body.classes[0].teachers

    assert(typeof teachers[0].address_1 === 'undefined')
    assert(typeof teachers[0].address_2 === 'undefined')
    assert(typeof teachers[0].phone === 'undefined')
    assert(typeof teachers[0].email === 'undefined')
    assert(typeof teachers[0].date_of_birth === 'undefined')

  })

  it('should populate teacher address, email, etc, if user is admin', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: [
        'teachers',
        'teachers.image',
      ],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).use(authorizeAdmin()).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {

          teachers: [
            {
              id: fixtures.userBill.id,
              image: null
            },
            {
              id: fixtures.userCharlie.id,
            },
          ],
        },
        {
          id: class2.id,
        },
      ],
    )

    const teachers = response.body.classes[0].teachers

    assert.strictEqual(teachers[0].address_1, '')
    assert.strictEqual(teachers[0].address_2,'')
    assert.strictEqual(teachers[0].phone, '55555552')
    assert.strictEqual(teachers[0].email, 'userBill@yogo.dk')
    assert.strictEqual(teachers[0].date_of_birth, '1980-05-20')

  })

})
