const assert = require('assert')
const moment = require('moment-timezone')

const assertAsyncThrows = require('../../../utils/assert-async-throws')
const assertAsyncDbObject = require('../../../utils/assert-async-db-object')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')

const MockDate = require('mockdate')
const sinon = require('sinon')
const supertest = require('supertest')

const apiRequestFake = require('../../../fakes/default-api-request-fake')
const emailStubFactory = require('../../../stubs/get-email-transport-send-email-spy')

const {authorizeUserAlice, authorizeAdmin} = require('../../../utils/request-helpers')

describe('controllers.Cron.log', async () => {


  before(async () => {

  })

  after(async () => {

  })

  it('should deny access if user is not logged in', async () => {
    const response = await supertest(sails.hooks.http.app)
      .post(
        '/cron/log' +
        '?client=' + testClientId)
      .send(
        {
          entry: 'Test string',
        },
      )
      .expect(403)


  })

  it('should allow access if user is logged in as customer', async () => {
    await supertest(sails.hooks.http.app)
      .post(
        '/cron/log' +
        '?client=' + testClientId)
      .send(
        {
          entry: 'Test string',
        },
      )
      .use(authorizeUserAlice())
      .expect(200)

  })

  it('should allow access if user is logged in as admin', async () => {
    await supertest(sails.hooks.http.app)
      .post(
        '/cron/log' +
        '?client=' + testClientId)
      .send({
          entry: 'Test string',
        },
      )
      .use(authorizeAdmin())
      .expect(200)

  })


  it('should log entry to CronLog', async () => {
    await supertest(sails.hooks.http.app)
      .post(
        '/cron/log' +
        '?client=' + testClientId)
      .send({
          entry: 'Test string',
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const insertedLogEntry = (await CronLog.find({})
        .limit(1)
        .sort('createdAt DESC')
    )[0]

    console.log("cron/log : 94 : ", insertedLogEntry)
    
    comparePartialObject(
      insertedLogEntry,
      {
        entry: 'Test string',
        client: testClientId,
      },
    )

  })

})
