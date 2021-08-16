const supertest = require('supertest');

const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const assert = require('assert');

const orderFixtureModule = require('../../../fixtures/reports_orders');

const moment = require('moment-timezone');


describe('controllers.Reports.generate, turnover', () => {

  before(async () => {
    orderFixtures = await orderFixtureModule.setup();
  });

  after(async () => {
    await orderFixtureModule.teardown();
  });

  it('should fail when user is not logged in', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'year',
        startDate: '2019-01-01',
        numberOfPreviousPeriods: 1,
      })
      .expect(403);

  });

  it('should fail when user is not admin', async () => {
    await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'year',
        startDate: '2019-01-01',
        numberOfPreviousPeriods: 1,
      })
      .use(authorizeUserAlice())
      .expect(403);
  });

  it('should return turnover for the specified year', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'year',
        startDate: '2018-01-01',
      })
      .use(authorizeAdmin())
      .expect(200);


    response.body.items = _.sortBy(response.body.items, ['item_type', 'item_id']);

    assert.deepEqual(
      response.body,
      {
        label: '2018',
        startDate: '2018-01-01',
        endDate: '2018-12-31',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
            name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
            turnover: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_count: 1,
            item_id: fixtures.eventWithoutTimeSlots.id,
            item_type: "event",
            name: "[13.06.2019] Event without time slots",
            turnover: fixtures.eventWithoutTimeSlots.price,
            vat_amount: 0,
            event_start_date: '2019-06-13',
          },
          {
            item_count: 1,
            item_id: fixtures.eventWithOneTimeSlot.id,
            item_type: "event",
            name: "[13.07.2019] Event with one time slot",
            turnover: fixtures.eventWithOneTimeSlot.price,
            vat_amount: 0,
            event_start_date: '2019-07-13',
          },
          {
            item_count: 1,
            item_id: fixtures.eventWithMultipleTimeSlots.id,
            item_type: "event",
            name: "[13.08.2019] Event with multiple time slots",
            turnover: fixtures.eventWithMultipleTimeSlots.price,
            vat_amount: 0,
            event_start_date: '2019-08-13',
          },
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeYogaUnlimited.id,
            name: fixtures.membershipTypeYogaUnlimited.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount * 3,
            vat_amount: 0,
            item_count: 3,
          },
        ],
      },
    );


    const response2 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'year',
        startDate: '2019-01-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    response2.body.items = _.sortBy(response2.body.items, ['item_type', 'item_id']);

    assert.deepEqual(
      response2.body,
      {
        label: '2019',
        startDate: '2019-01-01',
        endDate: '2019-12-31',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
            name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
            turnover: fixtures.classPassTypeYogaUnlimitedOneMonth.price * 3,
            vat_amount: 0,
            item_count: 3,
          },
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaTenClasses.id,
            name: fixtures.classPassTypeYogaTenClasses.name,
            turnover: fixtures.classPassTypeYogaTenClasses.price,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "gift_card_purchase",
            name: "",
            turnover: 250,
            vat_amount: 0,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "gift_card_spend",
            name: "",
            turnover: -250,
            vat_amount: 0,
          },
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeYogaUnlimited.id,
            name: fixtures.membershipTypeYogaUnlimited.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeDance.id,
            name: fixtures.membershipTypeDance.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "membership_no_show_fee",
            name: "Late cancellation fee, Hatha, Saturday Oct 16, 2020",
            turnover: 25,
            vat_amount: 0,
          },
          {
            item_count: 2,
            item_id: null,
            item_type: "membership_no_show_fee",
            name: "Late cancellation fee, Vinyasa, Friday Oct 15, 2020",
            turnover: 50,
            vat_amount: 0,
          },
          {
            item_type: 'product',
            item_id: fixtures.productYogaMat.id,
            name: fixtures.productYogaMat.name,
            turnover: fixtures.productYogaMat.price * 2,
            vat_amount: fixtures.productYogaMat.price * 2 * 0.2,
            item_count: 2,
          },
          {
            item_type: 'product',
            item_id: fixtures.productYogaShirt.id,
            name: fixtures.productYogaShirt.name,
            turnover: fixtures.productYogaShirt.price * 3,
            vat_amount: fixtures.productYogaShirt.price * 3 * 0.2,
            item_count: 3,
          },
        ],
      },
    );


  });


  it('should return turnover for the specified month', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2018-09-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    assert.deepEqual(
      response.body,

      {
        label: 'September 2018',
        startDate: '2018-09-01',
        endDate: '2018-09-30',
        items: [],
      },
    );


    const response2 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2018-10-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    response2.body.items = _.sortBy(response2.body.items, ['item_type', 'item_id']);


    assert.deepEqual(
      response2.body,
      {
        label: 'October 2018',
        startDate: '2018-10-01',
        endDate: '2018-10-31',
        items: [
          {
            item_count: 1,
            item_id: fixtures.eventWithoutTimeSlots.id,
            item_type: "event",
            name: "[13.06.2019] Event without time slots",
            turnover: 2000,
            vat_amount: 0,
            event_start_date: '2019-06-13',
          },
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeYogaUnlimited.id,
            name: fixtures.membershipTypeYogaUnlimited.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
            vat_amount: 0,
            item_count: 1,
          },
        ],
      },
    );

    const response3 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2018-11-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    response3.body.items = _.sortBy(response3.body.items, ['item_type', 'item_id']);

    assert.deepEqual(
      response3.body,

      {
        label: 'November 2018',
        startDate: '2018-11-01',
        endDate: '2018-11-30',
        items: [
          {
            item_count: 1,
            item_id: fixtures.eventWithOneTimeSlot.id,
            item_type: "event",
            name: "[13.07.2019] Event with one time slot",
            turnover: fixtures.eventWithOneTimeSlot.price,
            vat_amount: 0,
            event_start_date: '2019-07-13',
          },
          {
            item_count: 1,
            item_id: fixtures.eventWithMultipleTimeSlots.id,
            item_type: "event",
            name: "[13.08.2019] Event with multiple time slots",
            turnover: fixtures.eventWithMultipleTimeSlots.price,
            vat_amount: 0,
            event_start_date: '2019-08-13',
          },
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeYogaUnlimited.id,
            name: fixtures.membershipTypeYogaUnlimited.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
            vat_amount: 0,
            item_count: 1,
          },
        ],
      },
    );


    const response4 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2018-12-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    response4.body.items = _.sortBy(response4.body.items, ['item_type', 'item_id']);

    assert.deepEqual(
      response4.body,
      {
        label: 'December 2018',
        startDate: '2018-12-01',
        endDate: '2018-12-31',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
            name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
            turnover: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeYogaUnlimited.id,
            name: fixtures.membershipTypeYogaUnlimited.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
            vat_amount: 0,
            item_count: 1,
          },
        ],
      },
    );


    const response5 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2019-01-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    response5.body.items = _.sortBy(response5.body.items, ['item_type', 'item_id']);

    assert.deepEqual(
      response5.body,
      {
        label: 'January 2019',
        startDate: '2019-01-01',
        endDate: '2019-01-31',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaTenClasses.id,
            name: fixtures.classPassTypeYogaTenClasses.name,
            turnover: fixtures.classPassTypeYogaTenClasses.price,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeYogaUnlimited.id,
            name: fixtures.membershipTypeYogaUnlimited.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_type: 'product',
            item_id: fixtures.productYogaMat.id,
            name: fixtures.productYogaMat.name,
            turnover: fixtures.productYogaMat.price * 2,
            vat_amount: fixtures.productYogaMat.price * 2 * 0.2,
            item_count: 2,
          },
        ],
      },
    );


    const response6 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2019-02-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    assert.deepEqual(
      response6.body,
      {
        label: 'February 2019',
        startDate: '2019-02-01',
        endDate: '2019-02-28',
        items: [
          {
            item_type: 'membership',
            item_id: fixtures.membershipTypeDance.id,
            name: fixtures.membershipTypeDance.name,
            turnover: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
            vat_amount: 0,
            item_count: 1,
          },
        ],
      },
    );


    const response7 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2019-03-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    response7.body.items = _.sortBy(response7.body.items, ['item_type', 'item_id']);

    assert.deepEqual(
      response7.body,
      {
        label: 'March 2019',
        startDate: '2019-03-01',
        endDate: '2019-03-31',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
            name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
            turnover: fixtures.classPassTypeYogaUnlimitedOneMonth.price * 3,
            vat_amount: 0,
            item_count: 3,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "gift_card_purchase",
            name: "",
            turnover: 250,
            vat_amount: 0,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "gift_card_spend",
            name: "",
            turnover: -250,
            vat_amount: 0,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "membership_no_show_fee",
            name: "Late cancellation fee, Hatha, Saturday Oct 16, 2020",
            turnover: 25,
            vat_amount: 0,
          },
          {
            item_count: 2,
            item_id: null,
            item_type: "membership_no_show_fee",
            name: "Late cancellation fee, Vinyasa, Friday Oct 15, 2020",
            turnover: 50,
            vat_amount: 0,
          },
          {
            item_type: 'product',
            item_id: fixtures.productYogaShirt.id,
            name: fixtures.productYogaShirt.name,
            turnover: fixtures.productYogaShirt.price * 3,
            vat_amount: fixtures.productYogaShirt.price * 3 * 0.2,
            item_count: 3,
          },
        ],
      },
    );

    const response8 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'month',
        startDate: '2019-04-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    assert.deepEqual(
      response8.body,
      {
        label: 'April 2019',
        startDate: '2019-04-01',
        endDate: '2019-04-30',
        items: [],
      },
    );

  });

  it('should return turnover for the specified day', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'day',
        startDate: '2018-12-31',
      })
      .use(authorizeAdmin())
      .expect(200);

    assert.deepEqual(
      response.body,
      {
        label: '31.12.2018',
        startDate: '2018-12-31',
        endDate: '2018-12-31',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
            name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
            turnover: fixtures.classPassTypeYogaUnlimitedOneMonth.price,
            vat_amount: 0,
            item_count: 1,
          },
        ],
      },
    );

    const response2 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'day',
        startDate: '2019-01-01',
      })
      .use(authorizeAdmin())
      .expect(200);

    assert.deepEqual(
      response2.body,
      {
        label: '01.01.2019',
        startDate: '2019-01-01',
        endDate: '2019-01-01',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaTenClasses.id,
            name: fixtures.classPassTypeYogaTenClasses.name,
            turnover: fixtures.classPassTypeYogaTenClasses.price,
            vat_amount: 0,
            item_count: 1,
          },
          {
            item_type: 'product',
            item_id: fixtures.productYogaMat.id,
            name: fixtures.productYogaMat.name,
            turnover: fixtures.productYogaMat.price * 2,
            vat_amount: fixtures.productYogaMat.price * 2 * 0.2,
            item_count: 2,
          },
        ],
      },
    );

  });

  it('should return turnover for the specified custom date range', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'custom',
        startDate: '2019-02-20',
        endDate: '2019-03-20',
      })
      .use(authorizeAdmin())
      .expect(200);

    assert.deepEqual(
      response.body,

      {
        label: '20.02.2019 - 20.03.2019',
        startDate: '2019-02-20',
        endDate: '2019-03-20',
        items: [
          {
            item_type: 'class_pass_type',
            item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
            name: fixtures.classPassTypeYogaUnlimitedOneMonth.name,
            turnover: fixtures.classPassTypeYogaUnlimitedOneMonth.price * 3,
            vat_amount: 0,
            item_count: 3,
          },
          {
            item_type: 'product',
            item_id: fixtures.productYogaShirt.id,
            name: fixtures.productYogaShirt.name,
            turnover: fixtures.productYogaShirt.price * 3,
            vat_amount: fixtures.productYogaShirt.price * 3 * 0.2,
            item_count: 3,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "membership_no_show_fee",
            name: "Late cancellation fee, Hatha, Saturday Oct 16, 2020",
            turnover: 25,
            vat_amount: 0,
          },
          {
            item_count: 2,
            item_id: null,
            item_type: "membership_no_show_fee",
            name: "Late cancellation fee, Vinyasa, Friday Oct 15, 2020",
            turnover: 50,
            vat_amount: 0,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "gift_card_purchase",
            name: "",
            turnover: 250,
            vat_amount: 0,
          },
          {
            item_count: 1,
            item_id: null,
            item_type: "gift_card_spend",
            name: "",
            turnover: -250,
            vat_amount: 0,
          },
        ],
      },
    );

  });

  it('should account for discount codes', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();

    const orders = await Order.createEach([
      {
        client: testClientId,
        paid: moment.tz('2020-04-24 17:00:00', 'Europe/Copenhagen').format('x'),
        invoice_id: 1,
      },
      {
        client: testClientId,
        paid: moment.tz('2020-04-25 00:01:00', 'Europe/Copenhagen').format('x'),
        invoice_id: 2,
      },
    ]).fetch();

    const orderItems = await OrderItem.createEach([
      {
        client: testClientId,
        order: orders[0].id,
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        name: 'Membership type',
        total_price: 500,
        vat_amount: 0,
        applied_discount_code_amount: 40,
      },
      {
        client: testClientId,
        order: orders[0].id,
        item_type: 'class_pass_type',
        item_id: 1,
        name: 'Class pass type',
        total_price: 500,
        vat_amount: 0,
        applied_discount_code_amount: 500,
      },
      {
        client: testClientId,
        order: orders[0].id,
        item_type: 'product',
        item_id: 1,
        name: 'Product',
        total_price: 100,
        vat_amount: 20,
        applied_discount_code_amount: 50,
      },
      {
        client: testClientId,
        order: orders[1].id,
        item_type: 'membership_renewal',
        item_id: membership.id,
        name: 'Membership renewal',
        vat_amount: 0,
        total_price: 450,
        applied_discount_code_amount: 50,
        membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
      },
    ]);

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'custom',
        startDate: '2020-04-01',
        endDate: '2020-04-30',
      })
      .use(authorizeAdmin())
      .expect(200);


    expect(response.body.items).to.matchPattern(`
      [
        {
          item_type: 'class_pass_type',
          name: 'Class pass type',
          turnover: 0,
          vat_amount: 0,
          ...
        },
        {
          item_type: 'product',
          name: 'Product',
          turnover: 50,
          vat_amount: 10,
          ...
        },
        {
          item_type: 'membership',
          name: 'Yoga Unlimited',
          turnover: 910,
          vat_amount: 0,
          ...
        }
      ]`,
    );

    await Order.destroy({id: _.map(orders, 'id')});
    await OrderItem.destroy({id: _.map(orderItems, 'id')});

  });

});
