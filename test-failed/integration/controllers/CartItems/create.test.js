const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.CartItems.create', () => {

  let cartItemsForTestingDiscountCodes

  before(async () => {
    cartItemsForTestingDiscountCodes = [
      {
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        item_count: 1,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        item_count: 1,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        item_type: 'event',
        item_id: fixtures.eventWithOneTimeSlot.id,
        item_count: 1,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
    ]
  })


  it('should block unauthorized access', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        user: fixtures.userAlice.id,
      })
      .expect(403)

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userBillAccessToken)
      .expect(403)

  })

  it('should throw a badRequest if item_id is missing', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'class_pass_type',
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(400)
      .expect('"Missing item_id"')

  })

  it('should create the specified cart item', async () => {

    await CartItem.destroy({})

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)


    comparePartialObject(
      response.body,

      {
        user: fixtures.userAlice.id,
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        client: testClientId,
      },
    )

    const dbInsertedResult = await CartItem.find({})

    compareDbCollection(
      dbInsertedResult,
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'class_pass_type',
          item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        },
      ],
    )

    await CartItem.destroy({})

  })

  it('should create the specified cart item with membership campaign', async () => {

    await CartItem.destroy({})

    const membershipCampaign = await MembershipCampaign.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      number_of_months_at_reduced_price: 2,
      reduced_price: 0,
      min_number_of_months_since_customer_last_had_membership_type: 12,
    }).fetch()

    await MembershipType.update(
      {
        id: fixtures.membershipTypeYogaUnlimited.id,
      },
      {
        active_campaign: membershipCampaign.id,
      },
    )

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        user: fixtures.userAlice.id,
        membership_campaign: membershipCampaign.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)


    comparePartialObject(
      response.body,

      {
        user: fixtures.userAlice.id,
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        membership_campaign: membershipCampaign.id,
        client: testClientId,
      },
    )

    const dbInsertedResult = await CartItem.find({})

    compareDbCollection(
      dbInsertedResult,
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeYogaUnlimited.id,
          payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
          membership_campaign: membershipCampaign.id,
        },
      ],
    )

    await CartItem.destroy({})
    await MembershipCampaign.destroy({})
    await MembershipType.update(
      {
        id: fixtures.membershipTypeYogaUnlimited.id,
      },
      {
        active_campaign: null,
      },
    )

  })

  it('should create multiple cart items if item_count is larger than 1', async () => {

    await CartItem.destroy({})

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send(
        {
          item_type: 'product',
          item_id: fixtures.productYogaMat.id,
          item_count: 3,
          user: fixtures.userAlice.id,
        })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    comparePartialObject(
      response.body,
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
    )

    const dbInsertedResult = await CartItem.find({})

    compareDbCollection(
      dbInsertedResult,
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'product',
          item_id: fixtures.productYogaMat.id,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'product',
          item_id: fixtures.productYogaMat.id,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'product',
          item_id: fixtures.productYogaMat.id,
        },
      ],
    )

    await CartItem.destroy({})

  })

  it('should destroy previous cart items with same type and id', async () => {

    await CartItem.destroy({})

    await CartItem.createEach([
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      },
    ])

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const dbInsertedResult = await CartItem.find({})

    compareDbCollection(
      dbInsertedResult,
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'class_pass_type',
          item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        },
      ],
    )

    await CartItem.destroy({})

  })

  it('should destroy all previous cart items for memberships if the new item is a membership', async () => {

    await CartItem.destroy({})

    await CartItem.createEach([
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
      },
      {
        client: testClientId,
        user: fixtures.userBill.id,
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeDance.id,
      },
    ])

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeDance.id,
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const dbInsertedResult = await CartItem.find({})

    compareDbCollection(
      dbInsertedResult,
      [
        {
          client: testClientId,
          user: fixtures.userBill.id,
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeDance.id,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeDance.id,
        },
      ],
    )

    await CartItem.destroy({})

  })

  it('should destroy all previous cart items for that user if query param destroyOthers is set', async () => {

    await CartItem.destroy({})

    await CartItem.createEach([
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
      },
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeDanceTenClasses.id,
      },
      {
        client: testClientId,
        user: fixtures.userBill.id,
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeDanceTenClasses.id,
      },
      {
        client: testClientId,
        user: fixtures.userCharlie.id,
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaTenClasses.id,
      },
    ])

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId +
        '&destroyOthers=1',
      )
      .send({
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaTenClasses.id,
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const dbInsertedResult = await CartItem.find({})

    compareDbCollection(
      dbInsertedResult,
      [
        {
          client: testClientId,
          user: fixtures.userBill.id,
          item_type: 'class_pass_type',
          item_id: fixtures.classPassTypeDanceTenClasses.id,
        },
        {
          client: testClientId,
          user: fixtures.userCharlie.id,
          item_type: 'class_pass_type',
          item_id: fixtures.classPassTypeYogaTenClasses.id,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          item_type: 'class_pass_type',
          item_id: fixtures.classPassTypeYogaTenClasses.id,
        },
      ],
    )

    await CartItem.destroy({})

  })

  it('should throw a badRequest if item_type is discount_code and discount_code is missing', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'discount_code',
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(400)
      .expect('"Missing discount_code"')

  })

  it('should return E_DISCOUNT_CODE_NOT_FOUND if discount code is not found', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'discount_code',
        discount_code: 'XXXX',
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)
      .expect('E_DISCOUNT_CODE_NOT_FOUND')

  })

  it('should return E_DISCOUNT_CODE_CUSTOMER_LIMIT_REACHED', async () => {

    const existingOrders = await Order.createEach([{
      user: fixtures.userAlice.id,
      total: 1000,
      invoice_id: 1,
      client: testClientId
    }, {
      user: fixtures.userAlice.id,
      total: 1000,
      client: testClientId
    }]).fetch()

    const discountCode = await DiscountCode.create({
      name: 'testDiscountCode',
      has_customer_limit: true,
      customer_limit: 1,
      active: true,
      client: testClientId,
    }).fetch()

    const orderItems = await OrderItem.createEach([{
      order: existingOrders[0].id,
      item_type: 'discount_code',
      item_id: discountCode.id,
      client: testClientId
    }])

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'discount_code',
        discount_code: 'testDiscountCode',
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)
      .expect('E_DISCOUNT_CODE_CUSTOMER_LIMIT_REACHED')

    await Order.destroy({id: _.map(existingOrders, 'id')})
    await OrderItem.destroy({id: _.map(orderItems, 'id')})
    await DiscountCode.destroy({id: discountCode.id})

  })

  it('should return E_DISCOUNT_CODE_USE_PER_CUSTOMER_LIMIT_REACHED', async () => {

    const existingOrders = await Order.createEach([{
      user: fixtures.userAlice.id,
      total: 1000,
      invoice_id: 1,
      client: testClientId
    }, {
      user: fixtures.userAlice.id,
      total: 1000,
      client: testClientId
    }]).fetch()

    const discountCode = await DiscountCode.create({
      name: 'testDiscountCode',
      has_use_per_customer_limit: true,
      use_per_customer_limit: 1,
      active: true,
      client: testClientId,
    }).fetch()

    const orderItems = await OrderItem.createEach([{
      order: existingOrders[0].id,
      item_type: 'discount_code',
      item_id: discountCode.id
    }])

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'discount_code',
        discount_code: 'testDiscountCode',
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)
      .expect('E_DISCOUNT_CODE_USE_PER_CUSTOMER_LIMIT_REACHED')

    await Order.destroy({id: _.map(existingOrders, 'id')})
    await OrderItem.destroy({id: _.map(orderItems, 'id')})
    await DiscountCode.destroy({id: discountCode.id})
  })

  it('should apply a discount code', async () => {

    await CartItem.destroy({})

    const existingOrders = await Order.createEach([{
      user: fixtures.userAlice.id,
      total: 1000,
      invoice_id: 1,
      client: testClientId
    }, {
      user: fixtures.userAlice.id,
      total: 1000,
      client: testClientId
    }]).fetch()

    const discountCode = await DiscountCode.create({
      name: 'testDiscountCode',
      has_use_per_customer_limit: true,
      use_per_customer_limit: 2,
      has_customer_limit: true,
      customer_limit: 2,
      active: true,
      client: testClientId,
    }).fetch()

    const orderItems = await OrderItem.createEach([{
      order: existingOrders[0].id,
      item_type: 'discount_code',
      item_id: discountCode.id,
      client: testClientId
    }])

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'discount_code',
        discount_code: 'testDiscountCode',
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const createdCartItems = await CartItem.find({})

    comparePartialObject(createdCartItems,
      [{
        item_type: 'discount_code',
        item_id: discountCode.id,
        user: fixtures.userAlice.id
      }]
    )

    await Order.destroy({id: _.map(existingOrders, 'id')})
    await OrderItem.destroy({id: _.map(orderItems, 'id')})
    await CartItem.destroy({id: _.map(existingOrders, 'id')})
    await DiscountCode.destroy({id: discountCode.id})
  })

  it('should replace an already applied discount code', async () => {

    await CartItem.destroy({})

    const discountCode = await DiscountCode.create({
      name: 'testDiscountCode',
      has_use_per_customer_limit: true,
      use_per_customer_limit: 2,
      has_customer_limit: true,
      customer_limit: 2,
      active: true,
      client: testClientId,
    }).fetch()

    const discountCode2 = await DiscountCode.create({
      name: 'testDiscountCode2',
      has_use_per_customer_limit: true,
      use_per_customer_limit: 2,
      has_customer_limit: true,
      customer_limit: 2,
      active: true,
      client: testClientId,
    }).fetch()

    await CartItem.create({
      item_type: 'discount_code',
      item_id: discountCode.id,
      user: fixtures.userAlice.id
    })

    await supertest(sails.hooks.http.app)
      .post(
        '/cart-items' +
        '?client=' + testClientId,
      )
      .send({
        item_type: 'discount_code',
        discount_code: 'testDiscountCode2',
        user: fixtures.userAlice.id,
      })
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const createdCartItems = await CartItem.find({})

    comparePartialObject(createdCartItems,
      [{
        item_type: 'discount_code',
        item_id: discountCode2.id,
        user: fixtures.userAlice.id
      }]
    )

    await CartItem.destroy({})
    await DiscountCode.destroy({id: [discountCode.id, discountCode2.id]})

  })

})
