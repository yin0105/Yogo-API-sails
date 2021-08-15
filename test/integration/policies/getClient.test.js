const supertest = require('supertest');
const assert = require('assert');

const testClientId = require('../../global-test-variables').TEST_CLIENT_ID;

const fixtures = require('../../fixtures/factory').fixtures;
const jwToken = require('../../../api/services/jwTokens');

const {authorizeAdmin} = require('../../utils/request-helpers');

describe('policies.getClient', async () => {

  it('should fail if no client specified', async () => {

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .expect('"Missing client id"')
      .expect(400);

  });

  it('should use query client ID', async () => {

    const {body: client} = await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .query({client: testClientId})
      .expect(200);

    assert.strictEqual(
      client.id,
      testClientId,
    );

  });

  it('should fail if query client ID is invalid', async () => {

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .query({client: 99999})
      .expect('"E_INVALID_CLIENT_ID"')
      .expect(400);

  });

  it('should fail if query client ID is archived', async () => {

    await Client.update({id: testClientId}, {archived: true});

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .query({client: testClientId})
      .expect('"E_INVALID_CLIENT_ID"')
      .expect(400);

    await Client.update({id: testClientId}, {archived: false});

  });

  it('should use header X-Yogo-Client-ID', async () => {

    const {body: client} = await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set({'X-Yogo-Client-ID': testClientId})
      .expect(200);

    assert.strictEqual(
      client.id,
      testClientId,
    );

  });

  it('should fail if header X-Yogo-Client-ID is invalid', async () => {

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set({'X-Yogo-Client-ID': 999999})
      .expect(400);

  });

  it('should fail if header X-Yogo-Client-ID is archived', async () => {

    await Client.update({id: testClientId}, {archived: true});

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set({'X-Yogo-Client-ID': testClientId})
      .expect(400);

    await Client.update({id: testClientId}, {archived: false});

  });

  it('should use report token', async () => {

    const reportToken = jwToken.issue(
      {
        report: {
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      1000,
    );


    const {body: client} = await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .query({reportToken})
      .expect(200);

    assert.strictEqual(
      client.id,
      testClientId,
    );

  });

  it('should fail if reportToken is invalid', async () => {

    const reportToken = jwToken.issue(
      {
        ip: '::ffff:127.0.0.1',
      },
      1000,
    );

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .query({reportToken})
      .expect('"Invalid reportToken"')
      .expect(400);

  });

  it('should fail if reportToken.clientId is invalid', async () => {

    const reportToken = jwToken.issue(
      {
        report: {
          clientId: 99999,
        },
        ip: '::ffff:127.0.0.1',
      },
      1000,
    );

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .query({reportToken})
      .expect('"E_INVALID_CLIENT_ID"')
      .expect(400);

  });

  it('should fail if reportToken.clientId is archived', async () => {

    await Client.update({id: testClientId}, {archived: true});

    const reportToken = jwToken.issue(
      {
        report: {
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      1000,
    );

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .query({reportToken})
      .expect('"E_INVALID_CLIENT_ID"')
      .expect(400);

    await Client.update({id: testClientId}, {archived: false});

  });

  it('should use referrer domain to find client ID', async () => {

    const {body: client} = await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set('referrer', 'https://test-client.yogo.dk')
      .expect(200);

    assert.strictEqual(
      client.id,
      testClientId,
    );

  });

  it('should fail if referrer domain is not found', async () => {

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set('referrer', 'https://test-client-xxx.yogo.dk')
      .expect('"E_DOMAIN_NOT_RECOGNIZED"')
      .expect(400);

  });

  it('should fail if referrer domain is archived', async () => {

    await Domain.update({id: fixtures.testClientDomain.id}, {archived: true});

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set('referrer', 'https://test-client.yogo.dk')
      .expect('"E_DOMAIN_NOT_RECOGNIZED"')
      .expect(400);

    await Domain.update({id: fixtures.testClientDomain.id}, {archived: false});

  });

  it('should fail if referrer domain client is archived', async () => {

    await Client.update({id: testClientId}, {archived: true});

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set('referrer', 'https://test-client.yogo.dk')
      .expect('"E_DOMAIN_NOT_RECOGNIZED"')
      .expect(400);

    await Client.update({id: testClientId}, {archived: false});

  });

  it('should fail if referrer domain is in db multiple times', async () => {

    const extraDomain = await Domain.create({name: 'test-client.yogo.dk', client: testClientId + 1}).fetch();

    await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set('referrer', 'https://test-client.yogo.dk')
      .expect('"Multiple clients with same domain."')
      .expect(400);

    await Domain.destroy({id: extraDomain.id});

  });

  it('should use the correct client, if there is also one or more archived clients with the same domain', async () => {

    const archivedClient = await Client.create({
      id: 999999,
      archived: true,
      name: 'Archived client',
      email: 'archivedclient@yogo.dk'
    }).fetch()

    const domainForArchivedClient = await Domain.create({
      name: 'test-client.yogo.dk',
      client: archivedClient.id,
      archived: false
    }).fetch()

    const {body: client} = await supertest(sails.hooks.http.app)
      .get('/clients/current')
      .set('referrer', 'https://test-client.yogo.dk')
      .expect(200);

    assert.strictEqual(
      client.id,
      testClientId,
    );

    await Client.destroy({id: archivedClient.id})
    await Domain.destroy({id: domainForArchivedClient.id})

  })

  it('should use POST body client ID', async () => {
    // Is this still relevant after we switched to Reepay?
    console.log("authorizeAdmin = ", authorizeAdmin())
    console.log("testClientId = ", testClientId)
    const {body: classType} = await supertest(sails.hooks.http.app)
      .post('/class-types')
      .use(authorizeAdmin())
      .send({
        client: testClientId,
        name: 'Test class type',
        color: '#abcdef',
      })
      .expect(200);
  
    console.log("body: ", body);
    console.log("classType: ", classType);

    assert.strictEqual(
      classType.client,
      testClientId,
    );

  });

  it('should not use POST body client ID if query client ID is set', async () => {

    await supertest(sails.hooks.http.app)
      .post('/class-types')
      .use(authorizeAdmin())
      .query({client: 999999})
      .send({
        client: testClientId,
        name: 'Test class type',
        color: '#abcdef',
      })
      .expect('"E_INVALID_CLIENT_ID"')
      .expect(400);

  });

});
