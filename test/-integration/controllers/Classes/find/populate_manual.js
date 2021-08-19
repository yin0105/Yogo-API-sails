const supertest = require('supertest')
const qs = require('qs')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')
const MockDate = require('mockdate')
const moment = require('moment-timezone')

const {authorizeUserAlice} = require('../../../../utils/request-helpers')

describe('populate manual fields', () => {

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
      archived: false
    }).fetch()

    signups = await ClassSignup.createEach([
      {
        'class': class1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      }
    ]).fetch()

  })

  after(async () => {
    await Class.destroy({
      id: [
        class1.id,
        class2.id
      ],
    })
    await Membership.destroy({id: membership.id})
    await ClassSignup.destroy({id: _.map(signups, 'id')})

    MockDate.reset()
  })


  it('should populate Class.signup_count', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['signup_count'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {signup_count: 1},
        {signup_count: 0},
      ]
    )

  })

  it('should populate Class.user_has_access_to_class', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['user_has_access_to_class'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).use(authorizeUserAlice()).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {user_has_access_to_class: true},
        {user_has_access_to_class: false},
      ]
    )

  })

  it('should populate Class.user_is_signed_up_for_class', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['user_is_signed_up_for_class'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).use(authorizeUserAlice()).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {user_is_signed_up_for_class: true},
        {user_is_signed_up_for_class: false},
      ]
    )

  })

  it('should populate Class.class_accepts_customer_signups', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_accepts_customer_signups'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_accepts_customer_signups: false},
        {class_accepts_customer_signups: true},
      ]
    )

  })

  it('should populate Class.class_has_started', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_has_started'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_has_started: true},
        {class_has_started: false},
      ]
    )

  })

  it('should populate Class.class_is_fully_booked', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_is_fully_booked'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_is_fully_booked: false},
        {class_is_fully_booked: false},
      ]
    )

  })

  it('should populate Class.class_signup_deadline_has_been_exceeded', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_signup_deadline_has_been_exceeded'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_signup_deadline_has_been_exceeded: true},
        {class_signup_deadline_has_been_exceeded: false},
      ]
    )

  })

  it('should populate Class.user_can_sign_up_for_class', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['user_can_sign_up_for_class'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {user_can_sign_up_for_class: false},
        {user_can_sign_up_for_class: false},
      ]
    )

  })

  it('should populate Class.class_signoff_deadline_has_been_exceeded', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_signoff_deadline_has_been_exceeded'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_signoff_deadline_has_been_exceeded: true},
        {class_signoff_deadline_has_been_exceeded: false},
      ]
    )

  })

  it('should populate Class.user_can_sign_off_from_class', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['user_can_sign_off_from_class'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {user_can_sign_off_from_class: false},
        {user_can_sign_off_from_class: false},
      ]
    )

  })

  it('should populate Class.class_signoff_warning', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_signoff_warning'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_signoff_warning: null},
        {class_signoff_warning: null},
      ]
    )

  })

  it('should populate Class.class_signoff_deadline_timestamp with no-show fees disabled', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_signoff_deadline_timestamp'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_signoff_deadline_timestamp: 1526032800000}, // 2018-05-11 12:00:00 Europe/Copenhagen
        {class_signoff_deadline_timestamp: 1526472000000}, // 2018-05-16 14:00:00 Europe/Copenhagen
      ]
    )

  })

  it('should populate Class.class_signoff_deadline_timestamp with no-show fees enabled', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1
    }).fetch();

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['class_signoff_deadline_timestamp'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {class_signoff_deadline_timestamp: 1526025600000}, // 2018-05-11 10:00:00 Europe/Copenhagen
        {class_signoff_deadline_timestamp: 1526464800000}, // 2018-05-16 12:00:00 Europe/Copenhagen
      ]
    )

    await ClientSettings.destroy({id: clientSettingsRow.id});

  })

  it('should populate Class.user_must_receive_warning_after_signoff_deadline', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['user_must_receive_warning_after_signoff_deadline'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {user_must_receive_warning_after_signoff_deadline: true},
        {user_must_receive_warning_after_signoff_deadline: true},
      ]
    )

  })

})
