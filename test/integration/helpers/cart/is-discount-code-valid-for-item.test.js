const assert = require('assert')

const assertAsyncThrows = require('../../../utils/assert-async-throws')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const MockDate = require('mockdate')
const moment = require('moment-timezone')


describe('helpers.cart.is-discount-code-valid-for-item', async function () {


  it('should return true/false based on categories', async () => {

    let discountCodeMembershipTypes = {
      valid_for_items: [
        'membership_types',
      ]
    }

    let discountCodeClassPassTypes = {
      valid_for_items: [
        'class_pass_types',
      ]
    }

    let discountCodeEvents = {
      valid_for_items: [
        'events',
      ]
    }

    let discountCodeProducts = {
      valid_for_items: [
        'products',
      ]
    }

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeMembershipTypes, 'membership_type', 1),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeMembershipTypes, 'class_pass_type', 1),
      false
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeClassPassTypes, 'class_pass_type', 2),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeClassPassTypes, 'membership_type', 2),
      false
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeEvents, 'event', 2),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeEvents, 'membership_type', 2),
      false
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeProducts, 'product', 2),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeProducts, 'membership_type', 2),
      false
    )

  })

  it('should return true/false based on specific items', async () => {

    let discountCodeMembershipTypes = {
      valid_for_items: [
        'membership_type_1',
        'membership_type_2',
      ]
    }

    let discountCodeClassPassTypes = {
      valid_for_items: [
        'class_pass_type_1',
        'class_pass_type_2',
      ]
    }

    let discountCodeEvents = {
      valid_for_items: [
        'event_1',
        'event_2',
      ]
    }

    let discountCodeProducts = {
      valid_for_items: [
        'product_1',
        'product_2',
      ]
    }

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeMembershipTypes, 'membership_type', 1),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeMembershipTypes, 'membership_type', 3),
      false
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeMembershipTypes, 'class_pass_type', 1),
      false
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeClassPassTypes, 'class_pass_type', 1),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeClassPassTypes, 'class_pass_type', 3),
      false
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeEvents, 'event', 1),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeEvents, 'event', 3),
      false
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeProducts, 'product', 2),
      true
    )

    assert.strictEqual(
      sails.helpers.cart.isDiscountCodeValidForItem(discountCodeProducts, 'product', 3),
      false
    )

  })

})
