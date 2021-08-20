const supertest = require('supertest')
const qs = require('qs')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')

const {authorizeUserAlice, authorizeAdmin} = require('../../../../utils/request-helpers')

describe('calculate_access_for_another_user', () => {

  let
    class1,
    class2,
    membership

  before(async () => {

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
      archived: false,
    }).fetch()

  })

  after(async () => {
    await Class.destroy({
      id: [
        class1.id,
        class2.id,
      ],
    })
    await Membership.destroy({id: membership.id})
  })

 it('should throw if current user is no admin', async () => {

   const query = qs.stringify({
     client: testClientId,
     startDate: '2018-05-01',
     endDate: '2018-06-30',
     userToCalculateAccessFor: fixtures.userBill.id,
     populate: [
       'user_has_access_to_class'
     ]
   })

   await supertest(sails.hooks.http.app)
     .get('/classes')
     .query(query)
     .use(authorizeUserAlice())
     .expect(400)
     .expect('"Only admins can specify user to calculate access for"')

 })

  it('should throw if user is not logged in', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-06-30',
      userToCalculateAccessFor: fixtures.userBill.id,
      populate: [
        'user_has_access_to_class'
      ]
    })

    await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .expect(400)
      .expect('"Only admins can specify user to calculate access for"')

  })

  it('should return access parameters for userToCalculateAccessFor', async () => {

    let query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-06-30',
      userToCalculateAccessFor: fixtures.userAlice.id,
      populate: [
        'user_has_access_to_class'
      ]
    })

    let response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).use(authorizeAdmin()).expect(200)

      response.body.classes.sort((a, b) => {
        return a.user_has_access_to_class ? -1: 1;
      })


    comparePartialObject(
      response.body.classes,
      [
        {
          user_has_access_to_class:true
        },
        {
          user_has_access_to_class:false
        },
      ]
    )


    query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-06-30',
      userToCalculateAccessFor: fixtures.userBill.id,
      populate: [
        'user_has_access_to_class'
      ]
    })

    response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).use(authorizeAdmin()).expect(200)


    comparePartialObject(
      response.body.classes,
      [
        {
          user_has_access_to_class:false
        },
        {
          user_has_access_to_class:false
        },
      ]
    )

  })



})
