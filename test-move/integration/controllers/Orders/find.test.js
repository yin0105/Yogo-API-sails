const supertest = require('supertest');

const {authorizeAdmin, authorizeUserAlice, authorizeUserBill} = require('../../../utils/request-helpers');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

const comparePartialObject = require('../../../utils/compare-partial-object');

const orderFixtureModule = require('../../../fixtures/reports_orders');

describe('controllers.Orders.find', () => {

  let orderFixtures;


  before(async () => {
    orderFixtures = await orderFixtureModule.setup();
  });


  after(async () => {
    await orderFixtureModule.teardown();
  });

  it('should deny access if user is not logged in', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/orders/' + orderFixtures.order1.id +
        '?client=' + testClientId,
      )
      .expect(403);
  });


  it('should deny access to customer if order belongs to someone else', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/orders/' + orderFixtures.order1.id +
        '?client=' + testClientId,
      )
      .use(authorizeUserBill())
      .expect(403);
  });

  it('should deny access to customer if one of the orders belongs to someone else', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&id[]=' + orderFixtures.order1.id +
        '&id[]=' + orderFixtures.order8.id,
      )
      .use(authorizeUserAlice())
      .expect(403);
  });

  it('should allow access to customer if order belongs to that customer', async () => {
    const {body: order} = await supertest(sails.hooks.http.app)
      .get(
        '/orders/' + orderFixtures.order1.id +
        '?client=' + testClientId,
      )
      .use(authorizeUserAlice())
      .expect(200);

    expect(order).to.matchPattern(`{
      id: ${orderFixtures.order1.id},
      ... 
    }`);

  });

  it('should allow access to customer if all orders belong to that customer', async () => {
    const {body: order} = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&id[]=' + orderFixtures.order1.id +
        '&id[]=' + orderFixtures.order2.id,
      )
      .use(authorizeUserAlice())
      .expect(200);

    expect(order).to.matchPattern(`[{
      id: ${orderFixtures.order1.id},
      ... 
    },
    {
      id: ${orderFixtures.order2.id},
      ... 
    }]`);

  });


  it('should deny access to admin if order belongs to another client', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/orders/' + orderFixtures.orderOnOtherClient.id +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .expect(403);
  });

  it('should deny access to admin if one of the orders belongs to another client', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&id[]=' + orderFixtures.order1.id +
        '&id[]=' + orderFixtures.orderOnOtherClient.id,
      )
      .use(authorizeAdmin())
      .expect(403);
  });

  it('should allow access to admin if order belongs to that client', async () => {
    const {body: order} = await supertest(sails.hooks.http.app)
      .get(
        '/orders/' + orderFixtures.order1.id +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .expect(200);

    expect(order).to.matchPattern(`{
      id: ${orderFixtures.order1.id},
      ... 
    }`);

  });

  it('should allow access to admin if all orders belong to that client', async () => {
    const {body: order} = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&id[]=' + orderFixtures.order1.id +
        '&id[]=' + orderFixtures.order2.id,
      )
      .use(authorizeAdmin())
      .expect(200);

    expect(order).to.matchPattern(`[{
      id: ${orderFixtures.order1.id},
      ... 
    },
    {
      id: ${orderFixtures.order2.id},
      ... 
    }]`);

  });


  it('should throw if neither id nor periodType is specified', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .expect('"Id(s) or period must be specified."')
      .expect(400);

  });

  it('should return one order when id is an integer', async () => {

    const {body: order} = await supertest(sails.hooks.http.app)
      .get(
        '/orders/' + orderFixtures.order1.id +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .expect(200);

    expect(order).to.matchPattern(`{
      id: ${orderFixtures.order1.id},
      ... 
    }`);

    const {body: order2} = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&id=' + orderFixtures.order1.id,
      )
      .use(authorizeAdmin())
      .expect(200);

    expect(order2).to.matchPattern(`{
      id: ${orderFixtures.order1.id},
      ... 
    }`);

  });

  it('should return orders as array when id is an array', async () => {

    const {body: orders} = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&id[]=' + orderFixtures.order1.id +
        '&id[]=' + orderFixtures.order2.id,
      )
      .use(authorizeAdmin())
      .expect(200);

    expect(orders).to.matchPattern(`[
    {
      id: ${orderFixtures.order1.id},
      ... 
    },
    {
      id: ${orderFixtures.order2.id},
      ... 
    }
    ]`);

  });

  it('should return orders from the specified year', async () => {

    const response2018 = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&periodType=year' +
        '&year=2018',
      )
      .use(authorizeAdmin())
      .expect(200);

    const resultData2018 = _.sortBy(
      response2018.body,
      'invoice_id',
    );

    comparePartialObject(
      resultData2018,
      [
        {
          invoice_id: 1,
        },
        {
          invoice_id: 2,
        },
        {
          invoice_id: 3,
        },
        {
          invoice_id: 5,
        },
      ],
    );

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&periodType=year' +
        '&year=2019',
      )
      .use(authorizeAdmin())
      .expect(200);

    const resultData = _.sortBy(
      response.body,
      'invoice_id',
    );

    comparePartialObject(
      resultData,
      [
        {
          invoice_id: 4,
        },
        {
          invoice_id: 6,
        },
        {
          invoice_id: 7,
        },
        {
          invoice_id: 8,
        },
      ],
    );


  });


  it('should return orders from the specified month', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&periodType=month' +
        '&year=2019' +
        '&month=3',
      )
      .use(authorizeAdmin())
      .expect(200);


    const resultData = _.sortBy(
      response.body,
      'invoice_id',
    );


    comparePartialObject(
      resultData,
      [
        {
          invoice_id: 7,
        },
        {
          invoice_id: 8,
        },
      ],
    );


  });

  it('should return orders from the specified date', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&periodType=day' +
        '&date=2018-12-31',
      )
      .use(authorizeAdmin())
      .expect(200);


    comparePartialObject(
      response.body,
      [
        {
          invoice_id: 5,
        },
      ],
    );


  });

  it('should return orders from the specified custom date range', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/orders' +
        '?client=' + testClientId +
        '&periodType=custom' +
        '&startDate=2019-02-20' +
        '&endDate=2019-03-20',
      )
      .use(authorizeAdmin())
      .expect(200);

    comparePartialObject(
      response.body,
      [
        {
          invoice_id: 7,
        },
      ],
    );


  });


});
