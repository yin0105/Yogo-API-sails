const supertest = require('supertest')
const qs = require('qs')

const {authorizeAdmin} = require('../../../utils/request-helpers')
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID

const comparePartialObject = require('../../../utils/compare-partial-object')

const assert = require('assert')


describe('controllers.Clients.get-settings', () => {

  before(async () => {
    await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'theme',
        value: 'minimal',
      },
      {
        client: testClientId,
        key: 'signup_show_phone_field',
        value: 0,
      },
      {
        client: testClientId,
        key: 'checkin_classes_are_visible_for_minutes_after_start',
        value: 5,
      },
    ])
  })

  after(async () => {
    await ClientSettings.destroy({
      client: testClientId,
      key: ['theme', 'signup_show_phone_field', 'checkin_classes_are_visible_for_minutes_after_start'],
    })
  })

  describe('should give a badRequest for invalid keys', async () => {
    it('one invalid key', async () => {
      const response = await supertest(sails.hooks.http.app)
        .get(
          '/clients/' + testClientId + '/settings' +
          '?client=' + testClientId +
          '&keys[]=invalid_key' +
          '&keys[]=signup_show_phone_field' +
          '&keys[]=checkin_classes_are_visible_for_minutes_after_start' +
          '&keys[]=checkin_classes_are_visible_until',
        )
        .use(authorizeAdmin())
        .expect(400)

      const settingsSchema = sails.helpers.clientSettings.getSchema()

      assert.equal(
        response.body,
        'Query contains the following invalid key(s): invalid_key\n\nValid client settings are:\n' + JSON.stringify(Object.keys(settingsSchema)),
      )
    })

    it('three invalid keys', async () => {
      const response = await supertest(sails.hooks.http.app)
        .get(
          '/clients/' + testClientId + '/settings' +
          '?client=' + testClientId +
          '&keys[]=invalid_key' +
          '&keys[]=invalid_key_2' +
          '&keys[]=invalid_key_3' +
          '&keys[]=signup_show_phone_field' +
          '&keys[]=checkin_classes_are_visible_for_minutes_after_start' +
          '&keys[]=checkin_classes_are_visible_until',
        )
        .use(authorizeAdmin())
        .expect(400)

      const settingsSchema = sails.helpers.clientSettings.getSchema()

      assert.equal(
        response.body,
        'Query contains the following invalid key(s): invalid_key, invalid_key_2, invalid_key_3\n\nValid client settings are:\n' + JSON.stringify(Object.keys(settingsSchema)),
      )
    })

  })

  it('should return the requested settings, with defaults for keys that are not in the db', async () => {

    const query = qs.stringify({
      client: testClientId,
      keys: [
        'theme',
        'signup_show_phone_field',
        'checkin_classes_are_visible_for_minutes_after_start',
        'checkin_classes_are_visible_until',
      ],
    })

    const response = await supertest(sails.hooks.http.app)
      .get(`/clients/${testClientId}/settings`)
      .query(query)
      .use(authorizeAdmin())
      .expect(200)

    comparePartialObject(
      response.body,
      {
        theme: 'minimal',
        signup_show_phone_field: 0,
        checkin_classes_are_visible_for_minutes_after_start: 5,
        checkin_classes_are_visible_until: 'minutes_after_class_start',
      },
    )

  })

  it('should return default locale "en"', async () => {
    const query = qs.stringify({
      client: testClientId,
      keys: ['locale'],
    })

    await supertest(sails.hooks.http.app)
      .get(`/clients/${testClientId}/settings`)
      .query(query)
      .use(authorizeAdmin())
      .expect(
        200,
        {locale: 'en'},
      )

  })

  it('should return updated locale', async () => {
    const localeRecord = await ClientSettings
      .create({
        key: 'locale',
        value: 'da',
        client: testClientId,
      }).fetch()

    const query = qs.stringify({
      client: testClientId,
      keys: ['locale'],
    })

    await supertest(sails.hooks.http.app)
      .get(`/clients/${testClientId}/settings`)
      .query(query)
      .use(authorizeAdmin())
      .expect(
        200,
        {locale: 'da'},
      )

    await ClientSettings
      .destroy({
        id: localeRecord.id,
      })
  })

  it('should return default translation', async () => {
    const query = qs.stringify({
      client: testClientId,
      keys: ['membership_payment_failed_1_email_subject'],
    })

    await supertest(sails.hooks.http.app)
      .get(`/clients/${testClientId}/settings`)
      .query(query)
      .use(authorizeAdmin())
      .expect(
        200,
        {membership_payment_failed_1_email_subject: 'We could not renew your membership'},
      )

  })

  it('should return translated default if locale is specified', async () => {

    const localeRecord = await ClientSettings
      .create({
        key: 'locale',
        value: 'da',
        client: testClientId,
      }).fetch()

    const query = qs.stringify({
      client: testClientId,
      keys: ['membership_payment_failed_1_email_subject'],
    })

    await supertest(sails.hooks.http.app)
      .get(`/clients/${testClientId}/settings`)
      .query(query)
      .use(authorizeAdmin())
      .expect(
        200,
        {membership_payment_failed_1_email_subject: 'Vi kunne ikke forny dit medlemskab'},
      )

    await ClientSettings
      .destroy({
        id: localeRecord.id,
      })
  })
})
