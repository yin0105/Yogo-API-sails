const fixtures = require('./factory').fixtures
const testClientId = require('../global-test-variables').TEST_CLIENT_ID
const moment = require('moment-timezone')
moment.tz.setDefault('Europe/Copenhagen')

const orderFixtures = {
  orderItems: [],
}
/*
  order1, // Membership start, 2018-10-08
  order2, // Membership renewal, 2018-11-08
  order3, // Membership renewal, 2018-12-08
  order4, // Membership renewal, passed new year, 2019-01-08
  order9, // Membership renewal, changed membership type, 2019-02-08

  order5, // Class pass one month 2018-12-31 23:59:59

  order6, // Class pass 10 classes, 2 Yoga mats, 2019-01-01
  order7, // Class pass one month, 1 Yoga shirt, 2019-03-01
  order8, // Class pass one month, 2 Yoga shirt, 2019-03-08
  order9, // No-show fee, Vinyasa, 2019-03-08
  order10, // No-show fee, Vinyasa, 2019-03-08
  order11, // No-show fee, Hatha, 2019-03-08
*/

module.exports = {

  async setup() {
    moment.tz.setDefault('Europe/Copenhagen')
    orderFixtures.order1 = await Order.create({
      client: testClientId,
      paid: moment.tz('2018-10-08 15:00:00', 'Europe/Copenhagen').format('x'), // 2018-10-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 1,
    }).fetch()

    const oi1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order1.id,
      item_type: 'membership_type',
      item_id: fixtures.membershipTypeYogaUnlimited.id,
      name: fixtures.membershipTypeYogaUnlimited.name + '. Bruger: Ben. (månedlig)',
      item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      count: 1,
      total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi1)

    orderFixtures.membershipAlice = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      real_user_is_someone_else: true,
      real_user_name: 'Ben',
    }).fetch()

    const oi1_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order1.id,
      item_type: 'event',
      item_id: fixtures.eventWithoutTimeSlots.id,
      name: fixtures.eventWithoutTimeSlots.name,
      item_price: fixtures.eventWithoutTimeSlots.price,
      count: 1,
      total_price: fixtures.eventWithoutTimeSlots.price,
      archived: false,
    })
    orderFixtures.orderItems.push(oi1_1)

    orderFixtures.order2 = await Order.create({
      client: testClientId,
      paid: moment.tz('2018-11-08 15:00:00', 'Europe/Copenhagen').format('x'), // 2018-11-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 2,
    }).fetch()

    const oi2 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order2.id,
      item_type: 'membership_renewal',
      item_id: orderFixtures.membershipAlice.id,
      name: fixtures.membershipTypeYogaUnlimited.name + ', betaling for 1 måned, fra 8. november 2018 til 7. december 2018',
      item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      count: 1,
      total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      archived: false,
      membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch()
    orderFixtures.orderItems.push(oi2)

    const oi2_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order2.id,
      item_type: 'event',
      item_id: fixtures.eventWithOneTimeSlot.id,
      name: fixtures.eventWithOneTimeSlot.name,
      item_price: fixtures.eventWithOneTimeSlot.price,
      count: 1,
      total_price: fixtures.eventWithOneTimeSlot.price,
      archived: false,
    })
    orderFixtures.orderItems.push(oi2_1)

    const oi2_2 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order2.id,
      item_type: 'event',
      item_id: fixtures.eventWithMultipleTimeSlots.id,
      name: fixtures.eventWithMultipleTimeSlots.name,
      item_price: fixtures.eventWithMultipleTimeSlots.price,
      count: 1,
      total_price: fixtures.eventWithMultipleTimeSlots.price,
      archived: false,
    })
    orderFixtures.orderItems.push(oi2_2)


    orderFixtures.order3 = await Order.create({
      client: testClientId,
      paid: moment.tz('2018-12-08 15:00:00', 'Europe/Copenhagen').format('x'), // 2018-12-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 3,
    }).fetch()

    const oi3 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order3.id,
      item_type: 'membership_renewal',
      item_id: orderFixtures.membershipAlice.id,
      item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      name: fixtures.membershipTypeYogaUnlimited.name + ', betaling for 1 måned, fra 8. december 2018 til 7. januar 2018',
      count: 1,
      total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      archived: false,
      membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch()
    orderFixtures.orderItems.push(oi3)

    orderFixtures.order4 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-01-08 15:00:00', 'Europe/Copenhagen').format('x'), // 2019-01-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 4,
    }).fetch()

    const oi4 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order4.id,
      item_type: 'membership_renewal',
      item_id: orderFixtures.membershipAlice.id,
      name: fixtures.membershipTypeYogaUnlimited.name + ', betaling for 1 måned, fra 8. januar 2018 til 7. februar 2018',
      item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      count: 1,
      total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      archived: false,
      membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch()
    orderFixtures.orderItems.push(oi4)


    orderFixtures.order9 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-02-08 15:00:00', 'Europe/Copenhagen').format('x'), // 2019-02-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 9,
    }).fetch()

    const oi9 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order9.id,
      item_type: 'membership_renewal',
      item_id: orderFixtures.membershipAlice.id,
      name: fixtures.membershipTypeDance.name + ', betaling for 1 måned, fra 8. februar 2019 til 7. marts 2019',
      item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      count: 1,
      total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
      archived: false,
      membership_renewal_membership_type: fixtures.membershipTypeDance.id,
    }).fetch()
    orderFixtures.orderItems.push(oi9)


    orderFixtures.order5 = await Order.create({
      client: testClientId,
      paid: moment.tz('2018-12-31 23:59:59', 'Europe/Copenhagen').format('x'), // 2018-12-31 23:59:59
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 5,
    }).fetch()

    const oi5 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order5.id,
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
      item_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      count: 1,
      total_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi5)


    orderFixtures.order6 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-01-01 00:00:00', 'Europe/Copenhagen').format('x'), // 2019-01-01 00:00:00
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 6,
    }).fetch()

    const oi6_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order6.id,
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaTenClasses.id,
      name: fixtures.classPassTypeYogaTenClasses.name,
      item_price: fixtures.classPassTypeYogaTenClasses.price,
      count: 1,
      total_price: fixtures.classPassTypeYogaTenClasses.price,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi6_1)

    const oi6_2 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order6.id,
      item_type: 'product',
      item_id: fixtures.productYogaMat.id,
      name: fixtures.productYogaMat.name,
      item_price: fixtures.productYogaMat.price,
      count: 2,
      total_price: fixtures.productYogaMat.price * 2,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi6_2)


    orderFixtures.order7 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-03-01 15:00:00', 'Europe/Copenhagen').format('x'), // 2019-03-01
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 7,
    }).fetch()

    const oi7_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order7.id,
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
      item_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      count: 1,
      total_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi7_1)

    const oi7_2 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order7.id,
      item_type: 'product',
      item_id: fixtures.productYogaShirt.id,
      name: fixtures.productYogaShirt.name,
      item_price: fixtures.productYogaShirt.price,
      count: 1,
      total_price: fixtures.productYogaShirt.price,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi7_2)

    orderFixtures.order8 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-03-08 15:00:00', 'Europe/Copenhagen').format('x'), // 2019-03-08
      archived: false,
      user: fixtures.userBill.id,
      invoice_id: 8,
    }).fetch()

    const oi8_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order8.id,
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
      item_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      count: 1,
      total_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi8_1)

    const oi8_2 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order8.id,
      item_type: 'product',
      item_id: fixtures.productYogaShirt.id,
      name: fixtures.productYogaShirt.name,
      item_price: fixtures.productYogaShirt.price,
      count: 2,
      total_price: fixtures.productYogaShirt.price * 2,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi8_2)


    orderFixtures.order9 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-03-08 15:10:00', 'Europe/Copenhagen').format('x'), // 2019-03-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 9,
    }).fetch()

    const oi9_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order9.id,
      item_type: 'membership_no_show_fee',
      item_id: 1,
      name: 'Late cancellation fee, Vinyasa, Friday Oct 15, 2020',
      item_price: 25,
      count: 1,
      total_price: 25,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi9_1)

    orderFixtures.order10 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-03-08 15:20:00', 'Europe/Copenhagen').format('x'), // 2019-03-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 10,
    }).fetch()

    const oi10_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order10.id,
      item_type: 'membership_no_show_fee',
      item_id: 2,
      name: 'Late cancellation fee, Vinyasa, Friday Oct 15, 2020',
      item_price: 25,
      count: 1,
      total_price: 25,
      archived: false,
    }).fetch();
    orderFixtures.orderItems.push(oi10_1);

    orderFixtures.order11 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-03-08 15:30:00', 'Europe/Copenhagen').format('x'), // 2019-03-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 11,
    }).fetch()

    const oi11_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order11.id,
      item_type: 'membership_no_show_fee',
      item_id: 3,
      name: 'Late cancellation fee, Hatha, Saturday Oct 16, 2020',
      item_price: 25,
      count: 1,
      total_price: 25,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi11_1)

    orderFixtures.order12 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-03-08 15:40:00', 'Europe/Copenhagen').format('x'), // 2019-03-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 12,
    }).fetch()

    const oi12_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order12.id,
      item_type: 'gift_card_purchase',
      item_id: 1,
      name: 'Gift card',
      item_price: 250,
      count: 1,
      total_price: 250,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi12_1)


    orderFixtures.order13 = await Order.create({
      client: testClientId,
      paid: moment.tz('2019-03-08 15:50:00', 'Europe/Copenhagen').format('x'), // 2019-03-08
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 13,
    }).fetch()

    const oi13_1 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order13.id,
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
      item_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      count: 1,
      total_price: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi13_1)

    const oi13_2 = await OrderItem.create({
      client: testClientId,
      order: orderFixtures.order13.id,
      item_type: 'gift_card_spend',
      item_id: 1,
      name: 'Gift card',
      item_price: -250,
      count: 1,
      total_price: -250,
      archived: false,
    }).fetch()
    orderFixtures.orderItems.push(oi13_2)



    orderFixtures.orderOnOtherClient = await Order.create({
      client: 9999999,
      paid: 1546941859000, // 2019-01-08 GMT+02:00
      archived: false,
      user: fixtures.userAlice.id,
      invoice_id: 4,
    }).fetch()

    return orderFixtures
  },

  async teardown() {
    await Order.destroy({
      id: [
        orderFixtures.order1.id,
        orderFixtures.order2.id,
        orderFixtures.order3.id,
        orderFixtures.order4.id,
        orderFixtures.order5.id,
        orderFixtures.order6.id,
        orderFixtures.order7.id,
        orderFixtures.order8.id,
        orderFixtures.order9.id,
        orderFixtures.orderOnOtherClient.id,
      ],
    })

    await OrderItem.destroy({id: _.map(orderFixtures.orderItems, 'id')})
    await Membership.destroy({id: orderFixtures.membershipAlice.id})
  },

}
