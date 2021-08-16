const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')

const assert = require('assert')

const MockDate = require('mockdate')

const moment = require('moment')


describe('controllers.CartItems.destroy', () => {

  it('should return OK if cart item does not exist', async () => {

    await CartItem.destroy({})

    await supertest(sails.hooks.http.app)
      .delete(
        '/cart-items/99999999' +
        '?client=' + testClientId
      )
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect('"E_CART_ITEM_DOES_NOT_EXIST"')
      .expect(200)

  })

  it('should block unauthorized access', async () => {

    await CartItem.destroy({})

    const cartItems = await CartItem.createEach([
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

    await supertest(sails.hooks.http.app)
      .delete(
        '/cart-items/' + cartItems[2].id +
        '?client=' + testClientId,
      )
      .expect(403)

    await supertest(sails.hooks.http.app)
      .delete(
        '/cart-items/' + cartItems[1].id +
        '?client=' + testClientId,
      )
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect(403)

    await CartItem.destroy({})

  })


  it('should destroy the specified cart item', async () => {

    await CartItem.destroy({})

    const cartItems = await CartItem.createEach([
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
      .delete(
        '/cart-items/' + cartItems[0].id +
        '?client=' + testClientId,
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const dbResult = await CartItem.find({})

    dbResult.sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    });

    comparePartialObject(
      dbResult,
      [
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
      ],
    )

    await CartItem.destroy({})

  })

})
