const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures
const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers')

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')

const assert = require('assert')

describe('controllers.Users.update', () => {

  let user1

  before(async () => {

    user1 = await User.create({
      first_name: 'UserFirstName',
      last_name: 'UserLastName',
      address_1: 'UserAddress',
      address_2: 'UserAddress2',
      zip_code: 'UserZipCode',
      city: 'UserCity',
      country: 'UserCountry',
      phone: 'UserPhone',
      email: 'useremail@yogo.dk',
      date_of_birth: '1990-01-01',
      password: 'secretPassword',
      image: 1,
      customer_additional_info: 'UserAdditionalInfo',
      teacher: true,
      customer: true,
      admin: true,
      checkin: true,
    }).fetch()

  })

  after(async () => {
    await User.destroy({id: user1.id})
  })


  it('should deny access if user is not admin and not the user being edited', async () => {

    await supertest(sails.hooks.http.app)
      .put(
        '/users/' + user1.id +
        '?client=' + testClientId)
      .send(
        {
          first_name: 'UserFirstNameEdited',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

  })


  it('should return an error if the new email is already in use', async () => {

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/users/' + fixtures.userAlice.id +
        '?client=' + testClientId)
      .send(
        {
          email: fixtures.userBill.email,
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)


    assert.equal(
      response.text,
      '"E_EMAIL_EXISTS"',
    )


  })

  it('should allow editing if the email is not changed', async () => {

    const userAliceBackup = await User.findOne(fixtures.userAlice.id)

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/users/' + fixtures.userAlice.id +
        '?client=' + testClientId)
      .send(
        {
          email: fixtures.userAlice.email,
          first_name: 'Amanda',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    comparePartialObject(
      response.body,
      {
        email: fixtures.userAlice.email,
        first_name: 'Amanda',
      },
    )

    await User.update({id: fixtures.userAlice.id},
      {
        first_name: userAliceBackup.first_name,
      })


  })

  it('should allow changing the email to an unused email', async () => {

    const userAliceBackup = await User.findOne(fixtures.userAlice.id)

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/users/' + fixtures.userAlice.id +
        '?client=' + testClientId)
      .send(
        {
          email: 'this.email.is.not@used.already',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)


    comparePartialObject(
      response.body,
      {
        email: 'this.email.is.not@used.already',
      },
    )

    await User.update(
      {
        id: fixtures.userAlice.id,
      },
      {
        email: userAliceBackup.email,
      },
    )


  })

  it('should perform the update if a new email is not specified', async () => {

    const userAliceBackup = await User.findOne(fixtures.userAlice.id)

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/users/' + fixtures.userAlice.id +
        '?client=' + testClientId)
      .send(
        {
          first_name: 'Alicia',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    comparePartialObject(
      response.body,
      {
        first_name: 'Alicia',
      },
    )

    await User.update(
      {id: fixtures.userAlice.id},
      {
        first_name: userAliceBackup.first_name,
      },
    )

  })


})
