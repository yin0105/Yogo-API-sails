const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')

const {authorizeAdmin, authorizeUserAlice, authorizeUserBill} = require('../../../utils/request-helpers')

const assert = require('assert')

const MockDate = require('mockdate')


describe('controllers.MembershipTypes.update', () => {

  let
    membershipType,
    paymentOptions

  before(async () => {

  })

  beforeEach(async () => {
    membershipType = await MembershipType.create({
      client: testClientId,
      name: 'Test membership type',
      description: 'Description',
      class_types: [fixtures.classTypeYoga.id, fixtures.classTypeDance.id],
    }).fetch()

    paymentOptions = await MembershipTypePaymentOption.createEach([
      {
        client: testClientId,
        membership_type: membershipType.id,
        name: '1 month',
        number_of_months_payment_covers: 1,
        payment_amount: 100,
        for_sale: true,
      },
      {
        client: testClientId,
        membership_type: membershipType.id,
        name: '2 months',
        number_of_months_payment_covers: 2,
        payment_amount: 200,
        for_sale: true,
      },
    ]).fetch()
  })

  afterEach(async () => {
    await MembershipType.destroy({id: membershipType.id})
    await MembershipTypePaymentOption.destroy({id: _.map(paymentOptions, 'id')})
  })

  after(async () => {

  })


  describe('should deny access if', async () => {

    it('user is not admin', async () => {

      await supertest(sails.hooks.http.app)
        .put(
          '/membership-types/' + membershipType.id +
          '?client=' + testClientId)
        .send(
          {
            has_max_number_of_memberships: true,
          },
        )
        .use(authorizeUserBill())
        .expect(403)

    })

    it('user is not logged in', async () => {

      await supertest(sails.hooks.http.app)
        .put(
          '/membership-types/' + membershipType.id +
          '?client=' + testClientId)
        .send(
          {
            has_max_number_of_memberships: true,
          },
        )
        .expect(403)
    })

  })

  it('should update MembershipType', async () => {

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/membership-types/' + membershipType.id +
        '?client=' + testClientId)
      .send(
        {
          name: 'Updated name',
          image: fixtures.image1.id,
          class_types: [fixtures.classTypeDance.id],
          has_max_number_of_memberships: true,
          max_number_of_memberships: 20,
          has_max_number_of_classes_per_week: true,
          max_number_of_classes_per_week: 5,
          payment_options: paymentOptions,
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const returnedMembershipType = response.body.sort((a,b) => {
      return a.id > b.id ? 1: -1;
    })


    const expectedData = {
      name: 'Updated name',
      image: fixtures.image1.id,
      class_types: [
        {
          id: fixtures.classTypeDance.id,
        },
      ],
      has_max_number_of_memberships: true,
      max_number_of_memberships: 20,
      has_max_number_of_classes_per_week: true,
      max_number_of_classes_per_week: 5,
      payment_options: [
        {
          id: paymentOptions[0].id,
          name: '1 month',
          for_sale: true,
        },
        {
          id: paymentOptions[1].id,
          name: '2 months',
          for_sale: true,
        },
      ],
      active_campaign: null,
    }

    comparePartialObject(
      returnedMembershipType,
      expectedData,
    )

    const membershipTypeInDb = await MembershipType.findOne(membershipType.id)
      .populate('class_types')
      .populate('payment_options', {archived: false})
      .populate('active_campaign')

    comparePartialObject(
      membershipTypeInDb,
      expectedData,
    )

  })

  it('should set an existing image to expire when setting new image', async () => {
    const testImage = await Image.create({
      client: testClientId,
      filename: 'testImage.jpg',
      original_filename: 'testImage.jpg',
      expires: 0
    }).fetch()

    await MembershipType.update({id: membershipType.id}, {image: testImage.id})

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/membership-types/' + membershipType.id +
        '?client=' + testClientId)
      .send(
        {
          name: 'Updated name',
          image: fixtures.image1.id,
          class_types: [fixtures.classTypeDance.id],
          has_max_number_of_memberships: true,
          max_number_of_memberships: 20,
          has_max_number_of_classes_per_week: true,
          max_number_of_classes_per_week: 5,
          payment_options: paymentOptions,
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const updatedMembershipType = response.body

    comparePartialObject(
      updatedMembershipType,
      {
        image: fixtures.image1.id
      }
    )

    const testImageInDb = await Image.findOne(testImage.id)

    assert.strictEqual(
      testImageInDb.expires,
      1
    )

    await Image.destroy({id: testImage.id})

  })

  it('should set an existing image to expire when setting image to null', async () => {
    const testImage = await Image.create({
      client: testClientId,
      filename: 'testImage.jpg',
      original_filename: 'testImage.jpg',
      expires: 0
    }).fetch()

    await MembershipType.update({id: membershipType.id}, {image: testImage.id})

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/membership-types/' + membershipType.id +
        '?client=' + testClientId)
      .send(
        {
          name: 'Updated name',
          image: null,
          class_types: [fixtures.classTypeDance.id],
          has_max_number_of_memberships: true,
          max_number_of_memberships: 20,
          has_max_number_of_classes_per_week: true,
          max_number_of_classes_per_week: 5,
          payment_options: paymentOptions,
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const updatedMembershipType = response.body

    comparePartialObject(
      updatedMembershipType,
      {
        image: null
      }
    )

    const testImageInDb = await Image.findOne(testImage.id)

    assert.strictEqual(
      testImageInDb.expires,
      1
    )

    await Image.destroy({id: testImage.id})

  })

  it('should set an existing image to expire when setting image to undefined', async () => {
    const testImage = await Image.create({
      client: testClientId,
      filename: 'testImage.jpg',
      original_filename: 'testImage.jpg',
      expires: 0
    }).fetch()

    await MembershipType.update({id: membershipType.id}, {image: testImage.id})

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/membership-types/' + membershipType.id +
        '?client=' + testClientId)
      .send(
        {
          name: 'Updated name',
          class_types: [fixtures.classTypeDance.id],
          has_max_number_of_memberships: true,
          max_number_of_memberships: 20,
          has_max_number_of_classes_per_week: true,
          max_number_of_classes_per_week: 5,
          payment_options: paymentOptions,
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const updatedMembershipType = response.body

    comparePartialObject(
      updatedMembershipType,
      {
        image: null
      }
    )

    const testImageInDb = await Image.findOne(testImage.id)

    assert.strictEqual(
      testImageInDb.expires,
      1
    )

    await Image.destroy({id: testImage.id})

  })

})
