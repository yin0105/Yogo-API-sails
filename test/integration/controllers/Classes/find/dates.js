const supertest = require('supertest')
const qs = require('qs')
const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')
const MockDate = require('mockdate')
const moment = require('moment-timezone')

const {authorizeUserAlice} = require('../../../../utils/request-helpers')

describe('dates', () => {

 it('should throw if end date is before start date', async () => {

   const query = qs.stringify({
     client: testClientId,
     startDate: '2018-05-01',
     endDate: '2018-04-30',
   })

   await supertest(sails.hooks.http.app)
     .get('/classes').query(query).expect(400)
     .expect('"startDate must be before or equal to endDate"')

 })

  it('should throw if start date is before 2017', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2016-12-31',
      endDate: '2017-04-30',
    })

    await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(400)
      .expect('"Yogo started in 2017. You can not request classes earlier than that."')

  })

  it('should throw if date interval is longer than one year', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2017-01-01',
      endDate: '2018-01-01',
    })

    await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(400)
      .expect('"You can only request classes for up to one year at a time."')

  })

})
