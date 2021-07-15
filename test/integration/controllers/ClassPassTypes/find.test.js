const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const {authorizeUserAlice} = require('../../../utils/request-helpers')

describe('controllers.ClassPassTypes.find', () => {

  let classPassTypeOtherClient,
    classPassTypeArchived

  before(async () => {
    classPassTypeOtherClient = await ClassPassType.create(
      {
        client: testClientId + 1,
        pass_type: 'unlimited',
        days: 90,
      },
    ).fetch()

    classPassTypeArchived = await ClassPassType.create(
      {
        client: testClientId,
        pass_type: 'unlimited',
        days: 90,
        archived: true,
      },
    ).fetch()
  })

  after(async () => {
    await ClassPassType.destroy({
      id: [
        classPassTypeOtherClient.id,
        classPassTypeArchived.id,
      ],
    })
  })

  it('should return class pass types for the current client', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/class-pass-types' +
        '?client=' + testClientId,
      )
      .expect(200)

    expect(response.body).to.matchPattern(`
      [
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClasses.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClassesLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeDanceTenClasses.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOffer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
          ...
        },
      ]`
    )

  })

  it('should populate relations', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/class-pass-types' +
        '?client=' + testClientId +
        '&populate[]=image' +
        '&populate[]=class_types' +
        '&populate[]=price_groups',
      )
      .expect(200)

    expect(response.body).to.matchPattern(`
      [
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
          price_groups: [
            {
              id: ${fixtures.priceGroupYoga.id},
              ...
            }
          ],
          class_types: [
            {
              id: ${fixtures.classTypeYoga.id},
              ...
            }
          ],
          image: null,
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClasses.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClassesLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeDanceTenClasses.id},
          ...
        },
         {
          id: ${fixtures.classPassTypeYogaOneClassIntroOffer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
          ...
        },
      ]`
    )

  })

  it('should populate manual populate fields', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/class-pass-types' +
        '?client=' + testClientId +
        '&populate[]=max_number_per_customer_already_used' +
        '&populate[]=user_can_buy',
      )
      .expect(200)

    expect(response.body).to.matchPattern(`
      [
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
          price_groups: _.isUndefined,
          image: null,
          class_types: _.isUndefined,
          max_number_per_customer_already_used: null,
          user_can_buy: null,
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id},          
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClasses.id},
          max_number_per_customer_already_used: null,
          user_can_buy: null,
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClassesLivestream.id},          
          ...
        },
        {
          id: ${fixtures.classPassTypeDanceTenClasses.id},
          ...
        },
         {
          id: ${fixtures.classPassTypeYogaOneClassIntroOffer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
          ...
        },
      ]`
    )

    const response2 = await supertest(sails.hooks.http.app)
      .get(
        '/class-pass-types' +
        '?client=' + testClientId +
        '&populate[]=max_number_per_customer_already_used' +
        '&populate[]=user_can_buy',
      )
      .use(authorizeUserAlice())
      .expect(200)

    expect(response2.body).to.matchPattern(`
      [
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
          price_groups: _.isUndefined,
          max_number_per_customer_already_used: false,
          user_can_buy: true,
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id},          
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClasses.id},
          max_number_per_customer_already_used: false,
          user_can_buy: true,
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClassesLivestream.id},          
          ...
        },
        {
          id: ${fixtures.classPassTypeDanceTenClasses.id},
          ...
        },
         {
          id: ${fixtures.classPassTypeYogaOneClassIntroOffer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
          ...
        },
      ]`
    )

  })

  it('should filter on price group', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/class-pass-types' +
        '?client=' + testClientId +
        '&priceGroupName=Yoga',
      )
      .expect(200)

    expect(response.body).to.matchPattern(`
      [
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
          price_groups: _.isUndefined,
          max_number_per_customer_already_used: _.isUndefined,
          user_can_buy: _.isUndefined,
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClasses.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClassesLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOffer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
          ...
        },
      ]`
    )

  })

  it('should ignore invalid price group filter', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/class-pass-types' +
        '?client=' + testClientId +
        '&priceGroupName=XXXXXX',
      )
      .expect(200)

    expect(response.body).to.matchPattern(`
      [
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
          price_groups: _.isUndefined,
          max_number_per_customer_already_used: _.isUndefined,
          user_can_buy: _.isUndefined,
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClasses.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaTenClassesLivestream.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeDanceTenClasses.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOffer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id},
          ...
        },
        {
          id: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
          ...
        },
      ]`
    )

  })



})
