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

  it('should fail if trying to change the number of months on a payment option with memberships', async () => {

    const membership = await Membership.create({
      membership_type: membershipType.id,
      payment_option: paymentOptions[0].id,
      status: 'active',
      archived: false,
      client: testClientId,
    }).fetch()

    const modifiedPaymentOption0 = _.chain(paymentOptions[0])
      .cloneDeep()
      .assign({number_of_months_payment_covers: 3})
      .value()

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
            modifiedPaymentOption0,
            paymentOptions[1],
          ],
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"Cannot change number of months that payment covers for payment option id ' + paymentOptions[0].id + ' because there are active memberships with that payment option."')

    await Membership.destroy({id: membership.id})

  })

  it('should fail if trying to delete a payment option with memberships', async () => {

    const membership = await Membership.create({
      membership_type: membershipType.id,
      payment_option: paymentOptions[0].id,
      status: 'cancelled_running',
      archived: false,
      client: testClientId,
    }).fetch()

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
            paymentOptions[1],
          ],
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"Cannot delete payment option with id ' + paymentOptions[0].id + ' because there are active memberships with that payment option."')

    await Membership.destroy({id: membership.id})

  })

  it('should fail if there is more than one payment option for sale for same number of months', async () => {

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
            paymentOptions[0],
            paymentOptions[1],
            {
              name: 'Extra payment option for one month',
              for_sale: true,
              number_of_months_payment_covers: 1,
              payment_amount: 500,
            },
          ],
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"You can not have more than one payment option for sale for 1 months."')

  })

  it('should create/modify/delete payment options', async () => {

    /*
    Testing these actions in one update:
    - create a new payment option for 1 month and set the existing one (which has membership) to not for sale
    - modify the price of payment option for 2 months (which has membership)
    - change the number of months for payment option for 3 months to 4 months
    - archive payment option for 12 months
     */

    const extraPaymentOptions = await MembershipTypePaymentOption.createEach(
      [
        {
          client: testClientId,
          membership_type: membershipType.id,
          name: 'Archived payment option',
          for_sale: true,
          archived: true,
          number_of_months_payment_covers: 1,
          payment_amount: 400,
        },
        {
          client: testClientId,
          membership_type: membershipType.id,
          name: 'Payment option not for sale, will be archived',
          for_sale: false,
          number_of_months_payment_covers: 1,
          payment_amount: 400,
        },
        {
          client: testClientId,
          membership_type: membershipType.id,
          name: 'Should be able to change number of months for this payment options',
          for_sale: true,
          number_of_months_payment_covers: 3,
          payment_amount: 400,
        },
        {
          client: testClientId,
          membership_type: membershipType.id,
          name: 'Should be able to delete this payment options',
          for_sale: true,
          number_of_months_payment_covers: 12,
          payment_amount: 4000,
        },
      ],
    ).fetch()


    const memberships = await Membership.createEach(
      [
        {
          client: testClientId,
          membership_type: membershipType.id,
          payment_option: paymentOptions[0].id, // 1 month
          status: 'active',
        },
        {
          client: testClientId,
          membership_type: membershipType.id,
          payment_option: paymentOptions[1].id, // 2 months
          status: 'active',
        },
        {
          client: testClientId,
          membership_type: membershipType.id,
          payment_option: extraPaymentOptions[2].id, // 3 months, changing to 4 months
          status: 'ended',
        },
        {
          client: testClientId,
          membership_type: membershipType.id,
          payment_option: extraPaymentOptions[3].id, // 12 months, to be deleted
          status: 'ended',
        },
      ],
    )

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
          payment_options: [
            _.chain(paymentOptions[0]).cloneDeep().assign({for_sale: false}).value(), // 1 month existing payment option
            _.chain(paymentOptions[1]).cloneDeep().assign({payment_amount: 1000}).value(), // 2 months existing payment option
            {
              client: testClientId,
              membership_type: membershipType.id,
              number_of_months_payment_covers: 1,
              name: 'New payment option for 1 month',
              payment_amount: 1000,
              for_sale: true,
            },
            _.chain(extraPaymentOptions[2]).cloneDeep().assign({number_of_months_payment_covers: 4}).value(), // Changing from 3 to 4 months
          ],
          send_email_to_customer: false,
        },
      )
      .use(authorizeAdmin())
      .expect(200)

    const returnedPaymentOptions = response.body.payment_options

    const sortedReturnedPaymentOptions = _.sortBy(returnedPaymentOptions, ['number_of_months_payment_covers', 'archived', 'for_sale', 'payment_amount'])

    const expectedPaymentOptions = [
      {
        id: paymentOptions[0].id,
        name: '1 month',
        number_of_months_payment_covers: '1',
        for_sale: false,
      },
      {
        name: 'New payment option for 1 month',
        number_of_months_payment_covers: '1',
        for_sale: true,
      },
      {
        id: paymentOptions[1].id,
        name: '2 months',
        for_sale: true,
        payment_amount: '1000',
      },
      {
        id: extraPaymentOptions[2].id,
        name: 'Should be able to change number of months for this payment options',
        number_of_months_payment_covers: '4',
        payment_amount: '400',
        for_sale: true,
      },
    ]


    comparePartialObject(
      sortedReturnedPaymentOptions,
      expectedPaymentOptions,
    )

    const membershipTypeInDb = await MembershipType.findOne(membershipType.id)
      .populate('class_types')
      .populate('payment_options')
      .populate('active_campaign')

    const sortedPaymentOptionsFromDb = _.sortBy(membershipTypeInDb.payment_options, ['number_of_months_payment_covers', 'archived', 'for_sale', 'payment_amount'])

    const expectedPaymentOptionsIncludingArchived = [
      {
        id: paymentOptions[0].id,
        name: '1 month',
        number_of_months_payment_covers: '1',
        for_sale: false,
        archived: false,
      },
      {
        name: 'New payment option for 1 month',
        number_of_months_payment_covers: '1',
        for_sale: true,
      },
      {
        id: extraPaymentOptions[1].id,
        client: testClientId,
        membership_type: membershipType.id,
        name: 'Payment option not for sale, will be archived',
        for_sale: false,
        archived: true,
        number_of_months_payment_covers: 1,
        payment_amount: 400,
      },
      {
        id: extraPaymentOptions[0].id,
        client: testClientId,
        membership_type: membershipType.id,
        name: 'Archived payment option',
        for_sale: true,
        archived: true,
        number_of_months_payment_covers: 1,
        payment_amount: 400,
      },
      {
        id: paymentOptions[1].id,
        name: '2 months',
        for_sale: true,
        payment_amount: '1000',
      },
      {
        id: extraPaymentOptions[2].id,
        name: 'Should be able to change number of months for this payment options',
        number_of_months_payment_covers: '4',
        payment_amount: '400',
      },
      {
        id: extraPaymentOptions[3].id,
        client: testClientId,
        membership_type: membershipType.id,
        name: 'Should be able to delete this payment options',
        for_sale: true,
        number_of_months_payment_covers: 12,
        payment_amount: 4000,
      },
    ]

    comparePartialObject(
      sortedPaymentOptionsFromDb,
      expectedPaymentOptionsIncludingArchived,
    )

    await MembershipTypePaymentOption.destroy({id: _.map(extraPaymentOptions, 'id')})
    await Membership.destroy({id: _.map(memberships, 'id')})

  })

})
