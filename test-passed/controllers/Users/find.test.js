const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers');

const comparePartialObject = require('../../../utils/compare-partial-object');
const fixtures = require('../../../fixtures/factory').fixtures;


describe('controllers.Users.find', () => {

  it('should return forbidden if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .get('/users?client=' + testClientId)
      .expect(403);

    await supertest(sails.hooks.http.app)
      .get('/users?client=' + testClientId)
      .use(authorizeUserAlice())
      .expect(403);

  });


  it('should return all users', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/users?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200);

    comparePartialObject(
      response.body,
      [
        {
          email: 'userAlice@yogo.dk',
        },
        {
          email: 'userBill@yogo.dk',
        },
        {
          email: 'userCharlie@yogo.dk',
        },
        {
          email: 'userDennis@yogo.dk',
        },
        {
          email: 'userEvelyn@yogo.dk',
        },
        {
          email: 'userFiona@yogo.dk',
        },
        {
          email: 'userAdmin@yogo.dk',
        },
      ],
    );
  });

  it('should return users that match a search query', async () => {

    let response = await supertest(sails.hooks.http.app)
      .get(
        '/users?client=' + testClientId + '&searchQuery=a')
      .use(authorizeAdmin())
      .expect(200);    

    expect(response.body).to.matchPattern(`
      [
        {
          email: 'userAdmin@yogo.dk',
          ...
        },
        {
          email: 'userAlice@yogo.dk',
          ...
        },
        {
          email: 'userCharlie@yogo.dk',
          ...
        },
        {
          email: 'userEvelyn@yogo.dk',
          ...
        },
        {
          email: 'userFiona@yogo.dk',
          ...
        },
      ]
    `);

    response = await supertest(sails.hooks.http.app)
      .get(
        '/users?client=' + testClientId + '&searchQuery=al')
      .use(authorizeAdmin())
      .expect(200);


    expect(response.body).matchPattern(`
      [
        {
          email: 'userAlice@yogo.dk',
          ...
        },
      ]
    `);

  });

  it('should return users that match a search query for email', async () => {

    let response = await supertest(sails.hooks.http.app)
      .get(
        '/users?client=' + testClientId + '&searchQuery=userbill')
      .use(authorizeAdmin())
      .expect(200);


    expect(response.body).matchPattern(`
      [
        {
          email: 'userBill@yogo.dk',
          ...
        },
      ]
    `);
  });

  it('should return users that match a search query for phone', async () => {

    let response = await supertest(sails.hooks.http.app)
      .get(
        '/users?client=' + testClientId + '&searchQuery=53')
      .use(authorizeAdmin())
      .expect(200);


    expect(response.body).matchPattern(`
      [
        {
          email: 'userCharlie@yogo.dk',
          ...
        },
      ]
    `);
  });

  it('should return teachers, even if user is only a customer. Teacher list is public.', async () => {

    let response = await supertest(sails.hooks.http.app)
      .get(
        '/users?client=' + testClientId + '&teacher=1')
      .use(authorizeUserAlice())
      .expect(200);

    expect(response.body).matchPattern(`
      [
        {
          first_name: 'Evelyn',
          ...
        },
        {
          first_name: 'Fiona',
          ...
        },
      ]
    `);
  });

  it('should populate video_groups_that_customer_can_access', async () => {

    let {body: response} = await supertest(sails.hooks.http.app)
      .get(
        `/users?id=${fixtures.userAlice.id}&client=${testClientId}&populate[]=video_groups_that_customer_can_access`)
      .use(authorizeUserAlice())
      .expect(200);

    expect(response).to.matchPattern(`[{
      id: ${fixtures.userAlice.id},
      video_groups_that_customer_can_access: [],
      ...
    }]`);

  });

});
