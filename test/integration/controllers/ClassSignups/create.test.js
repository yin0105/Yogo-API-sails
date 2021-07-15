const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')

const assert = require('assert')

const {authorizeUserDennis, authorizeAdmin} = require('../../../utils/request-helpers')

const MockDate = require('mockdate')
const moment = require('moment-timezone')


describe('controllers.ClassSignups.create', () => {

  let class1,
    class2,
    class3,
    danceClass,
    cancelledClass,
    privateClass,
    signupClass1UserA,
    signupClass2UserA,
    signupClass3UserA,
    signupClass3UserB,
    signupClass3UserC,
    signupClass3UserCArchived,
    signupClass3UserCCancelled,
    membershipUserA,
    membershipUserB,
    classPassUserA,
    classPassUserB,
    classPassUserD

  before(async () => {
    class1 = await Class.create({
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      seats: 1,
    }).fetch()

    class2 = await Class.create({
      date: '2018-05-16',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 5,
    }).fetch()

    class3 = await Class.create({
      date: '2018-05-17',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      seats: 20
    }).fetch()

    danceClass = await Class.create({
      date: '2018-05-17',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeDance.id,
      seats: 20
    }).fetch()

    cancelledClass = await Class.create({
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      cancelled: true,
      seats: 20
    }).fetch()

    privateClass = await Class.create({
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 1
    }).fetch()


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

    classPassUserA = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
      client: testClientId,
    }).fetch()

    classPassUserB = await ClassPass.create({
      user: fixtures.userBill.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
      client: testClientId,
    }).fetch()

    classPassUserD = await ClassPass.create({
      user: fixtures.userDennis.id,
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
    }).fetch()

    signupClass3UserCCancelled = await ClassSignup.create({
      'class': class3.id,
      user: fixtures.userCharlie.id,
      client: testClientId,
      cancelled_at: Date.now(),
    }).fetch()

  })

  after(async () => {
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
          danceClass,
        ],
        'id',
      ),
    })

    await Membership.destroy({
      id: [membershipUserA.id, membershipUserB.id],
    })

    await ClassPass.destroy({
      id: [classPassUserA.id, classPassUserB.id],
    })

    MockDate.reset()

  })

  it('should create a signup record in the database using an available membership and return it', async () => {

    MockDate.set('3/16/2018')

    let responseSignupId

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': class2.id,
        user: fixtures.userBill.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect(200)

    const result = response.body

    comparePartialObject(
      result,
      {
        'class': class2.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
      },
    )
    responseSignupId = result.id

    const createdSignup = await ClassSignup.findOne(responseSignupId)

    comparePartialObject(
      createdSignup,
      {
        id: responseSignupId,
        'class': class2.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
      },
    )

    // Clean up
    await ClassSignup.destroy({id: responseSignupId})

    MockDate.reset()

  })

  it('should create a signup record in the database using an available class pass and return it', async () => {

    MockDate.set('3/16/2018')

    let responseSignupId

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': class2.id,
        user: fixtures.userDennis.id,
      })
      .use(authorizeUserDennis())
      .expect(200)

    const result = JSON.parse(response.text)
    comparePartialObject(
      result,
      {
        'class': class2.id,
        user: fixtures.userDennis.id,
        used_class_pass: classPassUserD.id,
      },
    )
    responseSignupId = result.id

    const createdSignup = await ClassSignup.findOne(responseSignupId)

    comparePartialObject(
      createdSignup,
      {
        id: responseSignupId,
        'class': class2.id,
        user: fixtures.userDennis.id,
        used_class_pass: classPassUserD.id,
      },
    )

    const updatedClassPass = await ClassPass.findOne(classPassUserD.id)
    assert.strictEqual(
      parseInt(updatedClassPass.classes_left),
      4
    )

    // Clean up
    await ClassSignup.destroy({id: responseSignupId})

    MockDate.reset()

  })

  it('should check customer in if requested by admin', async () => {

    MockDate.set('3/16/2018')

    let responseSignupId

    const {body: response} = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': class2.id,
        user: fixtures.userBill.id,
        checked_in: true,
      })
      .use(authorizeAdmin())
      .expect(200)

    expect(response).to.matchPattern(`
      {
        class: ${class2.id},
        user: ${fixtures.userBill.id},
        used_membership: ${membershipUserB.id},
        checked_in: _.isInteger,
        ...
      }`
    )
    responseSignupId = response.id

    const createdSignup = await ClassSignup.findOne(responseSignupId)

    comparePartialObject(
      createdSignup,
      {
        id: responseSignupId,
        class: class2.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
        checked_in: 'POSITIVE_INTEGER',
      },
    )

    // Clean up
    await ClassSignup.destroy({id: responseSignupId})

    MockDate.reset()

  })

  it('should not check customer in if requested by customer', async () => {

    MockDate.set('3/16/2018')

    let responseSignupId

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': class2.id,
        user: fixtures.userBill.id,
        checked_in: true,
      })
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect(200)

    const result = JSON.parse(response.text)
    comparePartialObject(
      result,
      {
        'class': class2.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
        checked_in: 0,
      },
    )
    responseSignupId = result.id

    const createdSignup = await ClassSignup.findOne(responseSignupId)

    comparePartialObject(
      createdSignup,
      {
        id: responseSignupId,
        'class': class2.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
        checked_in: 0,
      },
    )

    // Clean up
    await ClassSignup.destroy({id: responseSignupId})

    MockDate.reset()

  })

 /* it('should return "E_CLASS_PASS_NOT_VALID_FOR_CLASS" if class pass is not valid', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': danceClass.id,
        user: fixtures.userBill.id,
        used_class_pass: classPassUserB.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect(200)

    const result = JSON.parse(response.text)
    assert.equal(result, 'E_CLASS_PASS_NOT_VALID_FOR_CLASS')

  })

  it('should return "E_MEMBERSHIP_NOT_VALID_FOR_CLASS" if membership is not valid', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': danceClass.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect(200)

    const result = JSON.parse(response.text)
    assert.equal(result, 'E_MEMBERSHIP_NOT_VALID_FOR_CLASS')

  })

  */

  it('should return "E_ALREADY_SIGNED_UP" if customer is already signed up', async () => {

    MockDate.set('3/16/2018')

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': class1.id,
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const result = JSON.parse(response.text)
    assert.equal(result, 'E_ALREADY_SIGNED_UP')

    MockDate.reset()

  })

  it('should return "E_CLASS_CANCELLED" if class is cancelled', async () => {

    MockDate.set('3/16/2018')

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': cancelledClass.id,
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const result = JSON.parse(response.text)
    assert.equal(result, 'E_CLASS_CANCELLED')

    MockDate.reset()

  })

  it('should return "E_CLASS_IS_FULL" if class is full', async () => {

    MockDate.set('3/16/2018')

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': class1.id,
        user: fixtures.userBill.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect(200)

    const result = JSON.parse(response.text)
    assert.equal(result, 'E_CLASS_IS_FULL')

    MockDate.reset()

  })

  it('should return "E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP" if there is no valid class class or membership', async () => {

    MockDate.set('3/16/2018')

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': class2.id,
        user: fixtures.userCharlie.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userCharlieAccessToken)
      .expect(200)

    const result = JSON.parse(response.text)
    assert.equal(result, 'E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP')

    MockDate.reset()

  })

  describe('admin', async () => {

    it('should allow signup on same day, even after class start', async () => {

      // Using yoga class on 2018-05-16 10:00:00

      MockDate.set(moment.tz('2018-05-16 20:00:00', 'Europe/Copenhagen'))

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/class-signups' +
          '?client=' + testClientId,
        )
        .send({
          'class': class2.id,
          user: fixtures.userBill.id,
        })
        .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
        .set('X-Yogo-Request-Context', 'admin')
        .expect(200)

      const signup = response.body

      const createdSignup = await ClassSignup.findOne(signup.id)

      comparePartialObject(
        createdSignup,
        {
          id: signup.id,
          'class': class2.id,
          user: fixtures.userBill.id,
        },
      )

      await ClassSignup.destroy({id: signup.id})
      MockDate.reset()

    })

    it('should return "E_CLASS_HAS_STARTED" if the day has passed', async () => {

      // Using yoga class on 2018-05-16 10:00:00

      MockDate.set(moment.tz('2018-05-17 10:00:00', 'Europe/Copenhagen'))

      await supertest(sails.hooks.http.app)
        .post(
          '/class-signups' +
          '?client=' + testClientId,
        )
        .send({
          'class': class2.id,
          user: fixtures.userBill.id,
        })
        .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
        .set('X-Yogo-Request-Context', 'admin')
        .expect(200)
        .expect('"E_CLASS_HAS_STARTED"')


      MockDate.reset()

    })

  })

  describe('customer', async () => {

    it('should allow signup until checkin extra visible time has passed', async () => {

      // Using yoga class on 2018-05-16 10:00:00

      MockDate.set(moment.tz('2018-05-16 10:08:00', 'Europe/Copenhagen'))

      await ClientSettings.createEach([
        {
          key: 'checkin_classes_are_visible_until',
          value: 'minutes_after_class_start',
          client: testClientId,
        },
        {
          key: 'checkin_classes_are_visible_for_minutes_after_start',
          value: '15',
          client: testClientId,
        },
      ])


      const response = await supertest(sails.hooks.http.app)
        .post(
          '/class-signups' +
          '?client=' + testClientId,
        )
        .send({
          'class': class2.id,
          user: fixtures.userBill.id,
        })
        .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
        .expect(200)

      const signup = response.body

      const createdSignup = await ClassSignup.findOne(signup.id)

      comparePartialObject(
        createdSignup,
        {
          id: signup.id,
          'class': class2.id,
          user: fixtures.userBill.id,
        },
      )

      await ClientSettings.destroy({client: testClientId, key: ['checkin_classes_are_visible_until', 'checkin_classes_are_visible_for_minutes_after_start']})
      await ClassSignup.destroy({id: signup.id})
      MockDate.reset()

    })

    it('should return "E_CLASS_HAS_STARTED" if class has started, and optional extra checkin visible time has passed', async () => {

      // Using yoga class on 2018-05-16 10:00:00

      MockDate.set(moment.tz('2018-05-16 10:16:00', 'Europe/Copenhagen'))

      await ClientSettings.createEach([
        {
          key: 'checkin_classes_are_visible_until',
          value: 'minutes_after_class_start',
          client: testClientId,
        },
        {
          key: 'checkin_classes_are_visible_for_minutes_after_start',
          value: '15',
          client: testClientId,
        },
      ])

      await supertest(sails.hooks.http.app)
        .post(
          '/class-signups' +
          '?client=' + testClientId,
        )
        .send({
          'class': class2.id,
          user: fixtures.userBill.id,
        })
        .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
        .expect(200)
        .expect('"E_CLASS_HAS_STARTED"')


      MockDate.reset()

      await ClientSettings.destroy({client: testClientId, key: ['checkin_classes_are_visible_until', 'checkin_classes_are_visible_for_minutes_after_start']})

    })

    it('should return "E_SIGNUP_DEADLINE_HAS_BEEN_EXCEEDED" if class is a private class and signup deadline has been exceeded.', async () => {

      MockDate.set(moment.tz('2018-05-14 10:01:00', 'Europe/Copenhagen'))

      await supertest(sails.hooks.http.app)
        .post(
          '/class-signups' +
          '?client=' + testClientId,
        )
        .send({
          'class': privateClass.id,
          user: fixtures.userAlice.id,
        })
        .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
        .expect(200)
        .expect('"E_SIGNUP_DEADLINE_HAS_BEEN_EXCEEDED"')

      MockDate.reset()

    })

    it('should allow signup to private class if signup deadline has not been exceeded.', async () => {

      const membership = await Membership.create({
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        user: fixtures.userAlice.id,
        status: 'active',
        client: testClientId,
      }).fetch()

      MockDate.set(moment.tz('2018-05-14 09:59:00', 'Europe/Copenhagen'))

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/class-signups' +
          '?client=' + testClientId,
        )
        .send({
          'class': privateClass.id,
          user: fixtures.userAlice.id,
        })
        .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
        .expect(200)

      const signup = response.body

      const createdSignup = await ClassSignup.findOne(signup.id)

      comparePartialObject(
        createdSignup,
        {
          id: signup.id,
          'class': privateClass.id,
          user: fixtures.userAlice.id,
        },
      )

      await Membership.destroy({id: membership.id})
      await ClassSignup.destroy({id: signup.id})

      MockDate.reset()

    })

  })


})
