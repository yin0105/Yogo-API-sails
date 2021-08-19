const supertest = require('supertest')
const qs = require('qs')

const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers')
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')

const assert = require('assert')

const jsonwebtoken = require('jsonwebtoken')
const jwToken = require('../../../../api/services/jwTokens')

const moment = require('moment')


describe('controllers.Reports.makeReportToken', () => {

  before(async () => {

  })

  after(async () => {

  })

  it('should fail when user is not logged in', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/reports/make-report-token' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'year',
        startDate: '2019-01-01',
      })
      .expect(403)

  })

  it('should fail when user is not admin', async () => {
    await supertest(sails.hooks.http.app)
      .post(
        '/reports/make-report-token' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'year',
        startDate: '2019-01-01',
      })
      .use(authorizeUserAlice())
      .expect(403)
  })

  it('should return token valid for the specified report', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/reports/make-report-token' +
        '?client=' + testClientId,
      )
      .send({
        periodType: 'year',
        startDate: '2018-01-01',
      })
      .use(authorizeAdmin())
      .expect(200)

    jwToken.verify(response.body.token, function (err, payload) {
      if (err) throw err

      assert.deepEqual(
        _.pick(
          payload,
          ['report', 'ip'],
        ),
        {
          ip: '::ffff:127.0.0.1',
          report: {
            periodType: 'year',
            startDate: '2018-01-01',
            clientId: testClientId,
          },
        },
      )

      if (payload.exp > moment().format('X') + 60) {
        throw new Error('Token expiration time is more than one minute')
      }
    })

  })


})
