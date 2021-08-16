const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')

const assert = require('assert')

const MockDate = require('mockdate')

const moment = require('moment')

const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers')


describe('controllers.CartItems.find', () => {


  describe('should block unauthorized access', async () => {

    it('no authorization', async () => {
      await supertest(sails.hooks.http.app)
        .get(
          '/cart-items' +
          '?client=' + testClientId +
          '&user=' + fixtures.userAlice.id,
        )
        .expect(403)
    })

    it('wrong user', async () => {
      await supertest(sails.hooks.http.app)
        .get(
          '/cart-items' +
          '?client=' + testClientId +
          '&user=' + fixtures.userAlice.id,
        )
        .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
        .expect(403)
    })

    it('admin auth, user is wrong client', async () => {

      const userOnWrongClient = await User.create({
        client: testClientId + 1,
        email: 'useronwrongclient@yogo.dk',
      }).fetch()

      await supertest(sails.hooks.http.app)
        .get(
          '/cart-items' +
          '?client=' + testClientId +
          '&user=' + userOnWrongClient.id,
        )
        .use(authorizeAdmin())
        .expect(403)

      await User.destroy({id: userOnWrongClient.id})
    })

  })


  it('should return all cart items for the specified user', async () => {

    await CartItem.destroy({})

    await CartItem.createEach([
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      },
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
        real_user_name: 'Bob',
      },
      {
        client: testClientId,
        user: fixtures.userBill.id,
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaTenClasses.id,
      },
    ]).fetch()

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/cart-items' +
        '?client=' + testClientId +
        '&user=' + fixtures.userAlice.id,
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    comparePartialObject(
      response.body,
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'class_pass_type',
          item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeYogaUnlimited.id,
          payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
          real_user_name: 'Bob',
        },
      ],
    )

    await CartItem.destroy({})

  })

  it('should populate product and payment_option if specified', async () => {

    await CartItem.destroy({})

    await CartItem.createEach([
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
        real_user_name: 'Bob',
      },
    ]).fetch()

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/cart-items' +
        '?client=' + testClientId +
        '&user=' + fixtures.userAlice.id +
        '&populate[]=product' +
        '&populate[]=payment_option',
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    comparePartialObject(
      response.body,
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeYogaUnlimited.id,
          payment_option: {
            id: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
          },
          real_user_name: 'Bob',
          product: {
            id: fixtures.membershipTypeYogaUnlimited.id,
          },
        },
      ],
    )

    await CartItem.destroy({})

  })


})
