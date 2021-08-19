const supertest = require('supertest')

const {authorizeAdmin} = require('../../../utils/request-helpers')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')


describe('controllers.Clients.update-settings', () => {

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
        key: 'signup_show_date_of_birth_field',
        value: 1,
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
      key: ['theme', 'signup_show_phone_field', 'signup_show_date_of_birth_field', 'checkin_classes_are_visible_for_minutes_after_start'],
    })
  })

  it('should give a badRequest if one or more keys are invalid', async () => {

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/clients/' + testClientId + '/settings' +
        '?client=' + testClientId,
      )
      .send({
        invalid_key: 'invalid',
        signup_show_phone_field: 1,
        signup_show_date_of_birth_field: 0,
        checkin_classes_are_visible_for_minutes_after_start: 10,
        checkin_classes_are_visible_until: 'class_ended',
      })
      .use(authorizeAdmin())
      .expect(400)

    const settingsSchema = sails.helpers.clientSettings.getSchema()

    assert.equal(
      response.body,
      'The following key(s) are not valid: invalid_key\n\nThe following client settings (plus some secret settings) are valid:\n' + JSON.stringify(settingsSchema),
    )

  })

  it('should give a badRequest if the settings has pre-defined values and the specified value is not one of them', async () => {

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/clients/' + testClientId + '/settings' +
        '?client=' + testClientId,
      )
      .send({
        theme: 'invalid_theme_name',
      })
      .use(authorizeAdmin())
      .expect(400)

    assert.equal(
      response.body,
      'The specified value "invalid_theme_name" is not valid for the setting "theme". The following values are valid: framed, minimalistic.',
    )

  })

  it('should give a badRequest if a setting should be an email and validation fails', async () => {

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/clients/' + testClientId + '/settings' +
        '?client=' + testClientId,
      )
      .send({
        email_bcc_to_client_send_to: 'notanemail@address',
      })
      .use(authorizeAdmin())
      .expect(400)

    assert.equal(
      response.body,
      'The specified value "notanemail@address" does not look like a valid email.',
    )

  })

  it('should update the requested settings', async () => {

    await supertest(sails.hooks.http.app)
      .put(
        '/clients/' + testClientId + '/settings' +
        '?client=' + testClientId,
      )
      .send({
        signup_show_phone_field: 1,
        signup_show_date_of_birth_field: 0,
        checkin_classes_are_visible_for_minutes_after_start: 10,
        checkin_classes_are_visible_until: 'class_end',
      })
      .use(authorizeAdmin())
      .expect(200)

    const dbDump = await ClientSettings.find({
      client: testClientId,
      key: ['checkin_classes_are_visible_for_minutes_after_start', 'checkin_classes_are_visible_until', 'signup_show_date_of_birth_field', 'signup_show_phone_field', 'theme']
    }).sort('key ASC')

    expect(dbDump).to.matchPattern(`
      [
        {
          key: 'checkin_classes_are_visible_for_minutes_after_start',
          value: '10',
          ...
        },
        {
          key: 'checkin_classes_are_visible_until',
          value: 'class_end',
          ...
        },
        {
          key: 'signup_show_date_of_birth_field',
          value: '0',
          ...
        },
        {
          key: 'signup_show_phone_field',
          value: '1',
          ...
        },
        {
          key: 'theme',
          value: 'minimal',
          ...
        },
      ]`,
    )

  })

})
