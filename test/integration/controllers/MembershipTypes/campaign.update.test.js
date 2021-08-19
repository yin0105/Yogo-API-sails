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

  it('should create a new membership campaign', async () => {

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
          active_campaign: {
            name: 'Test campaign',
            number_of_months_at_reduced_price: 2,
            reduced_price: 100,
            min_number_of_months_since_customer_last_had_membership_type: 12,
          },
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const returnedMembershipType = response.body

    comparePartialObject(
      returnedMembershipType.active_campaign,
      {
        client: testClientId,
        name: 'Test campaign',
        number_of_months_at_reduced_price: 2,
        reduced_price: 100,
        min_number_of_months_since_customer_last_had_membership_type: 12,
      },
    )

    await MembershipCampaign.destroy({id: returnedMembershipType.active_campaign.id})
    await MembershipType.update({id: membershipType.id}, {active_campaign: null})

  })

  it('should use an existing campaign if available', async () => {

    const existingCampaign = await MembershipCampaign.create({
      client: testClientId,
      name: 'Test campaign',
      number_of_months_at_reduced_price: 2,
      reduced_price: 100,
      min_number_of_months_since_customer_last_had_membership_type: 12,
    }).fetch()

    const campaignCountInDbBefore = (await MembershipCampaign.find({})).length

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
          active_campaign: {
            name: 'Test campaign',
            number_of_months_at_reduced_price: 2,
            reduced_price: 100,
            min_number_of_months_since_customer_last_had_membership_type: 12,
          },
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const returnedMembershipType = response.body

    assert.strictEqual(
      returnedMembershipType.active_campaign.id,
      existingCampaign.id,
    )

    const campaignsInDb = await MembershipCampaign.find({})

    assert.strictEqual(
      campaignsInDb.length,
      campaignCountInDbBefore,
    )

    comparePartialObject(
      returnedMembershipType.active_campaign,
      {
        client: testClientId,
        name: 'Test campaign',
        number_of_months_at_reduced_price: 2,
        reduced_price: 100,
        min_number_of_months_since_customer_last_had_membership_type: 12,
      },
    )

    await MembershipCampaign.destroy({id: returnedMembershipType.active_campaign.id})
    await MembershipType.update({id: membershipType.id}, {active_campaign: null})

  })

  it('should fail to create campaign if there is no payment option for sale for one month', async () => {

    await supertest(sails.hooks.http.app)
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
          payment_options: [
            paymentOptions[1]
          ],
          send_email_to_customer: false,
          active_campaign: {
            name: 'Test campaign',
            number_of_months_at_reduced_price: 2,
            reduced_price: 100,
            min_number_of_months_since_customer_last_had_membership_type: 12,
          },
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"You can not have an active campaign without a payment option for one month."')

  })

})
