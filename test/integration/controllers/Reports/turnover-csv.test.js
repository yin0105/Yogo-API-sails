const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const assert = require('assert')

const orderFixtureModule = require('../../../fixtures/reports_orders')

const jwToken = require('../../../../api/services/jwTokens')


describe('controllers.Reports.turnover, CSV', () => {

  before(async () => {
    orderFixtures = await orderFixtureModule.setup()
  })

  after(async () => {
    await orderFixtureModule.teardown()
  })

  it('should fail when token is not provided', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv',
      )
      .expect(400) // Not 403. Because this check is in policies/getClient, so it actually means that no client is provided

  })

  it('should fail when token is not valid', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=adsfljhasdfkljh',
      )
      .expect(400) // Not 403. Because this check is in policies/getClient, so it actually means that no client is provided
  })

  it('should fail when token is expired', async () => {

    const expiredToken = jwToken.issue({
        report: {
          periodType: 'year',
          startDate: '2018-01-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      -1,
    )

    await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + expiredToken,
      )
      .expect(400) // Not 403. Because this check is in policies/getClient, so it actually means that no client is provided
  })

  it('should return turnover for the specified year', async () => {

    const token2018 = jwToken.issue({
        report: {
          periodType: 'year',
          startDate: '2018-01-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const response2018 = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + token2018,
      )
      .expect(200)

    assert.equal(
      response2018.text,
      `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
class_pass_type,${fixtures.classPassTypeYogaUnlimitedOneMonth.id},${fixtures.classPassTypeYogaUnlimitedOneMonth.name},1,${fixtures.classPassTypeYogaUnlimitedOneMonth.price},0
event,${fixtures.eventWithoutTimeSlots.id},[13.06.2019] Event without time slots,1,${fixtures.eventWithoutTimeSlots.price},0
event,${fixtures.eventWithOneTimeSlot.id},[13.07.2019] Event with one time slot,1,${fixtures.eventWithOneTimeSlot.price},0
event,${fixtures.eventWithMultipleTimeSlots.id},[13.08.2019] Event with multiple time slots,1,${fixtures.eventWithMultipleTimeSlots.price},0
membership,${fixtures.membershipTypeYogaUnlimited.id},${fixtures.membershipTypeYogaUnlimited.name},3,${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount * 3},0
`)


    const token2019 = jwToken.issue({
        report: {
          periodType: 'year',
          startDate: '2019-01-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const response2019 = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + token2019,
      )
      .expect(200)

    assert.equal(
      response2019.text,
      `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
class_pass_type,${fixtures.classPassTypeYogaUnlimitedOneMonth.id},${fixtures.classPassTypeYogaUnlimitedOneMonth.name},3,${fixtures.classPassTypeYogaUnlimitedOneMonth.price * 3},0
class_pass_type,${fixtures.classPassTypeYogaTenClasses.id},${fixtures.classPassTypeYogaTenClasses.name},1,${fixtures.classPassTypeYogaTenClasses.price},0
gift_card_purchase,,,1,250,0
gift_card_spend,,,1,-250,0
membership,${fixtures.membershipTypeDance.id},${fixtures.membershipTypeDance.name},1,${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount},0
membership,${fixtures.membershipTypeYogaUnlimited.id},${fixtures.membershipTypeYogaUnlimited.name},1,${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount},0
membership_no_show_fee,,"Late cancellation fee, Hatha, Saturday Oct 16, 2020",1,25,0
membership_no_show_fee,,"Late cancellation fee, Vinyasa, Friday Oct 15, 2020",2,50,0
product,${fixtures.productYogaMat.id},${fixtures.productYogaMat.name},2,${fixtures.productYogaMat.price * 2},${fixtures.productYogaMat.price * 2 * 0.2}
product,${fixtures.productYogaShirt.id},${fixtures.productYogaShirt.name},3,${fixtures.productYogaShirt.price * 3},${fixtures.productYogaShirt.price * 3 * 0.2}
`)


  })


  it('should return turnover for the specified month', async () => {

    const tokenSeptember = jwToken.issue({
        report: {
          periodType: 'month',
          startDate: '2018-09-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )


    const responseSeptember = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + tokenSeptember,
      )
      .expect(200)

    assert.equal(
      responseSeptember.text,
      'Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms\n',
    )

    const tokenOctober = jwToken.issue({
        report: {
          periodType: 'month',
          startDate: '2018-10-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const responseOctober = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + tokenOctober,
      )
      .expect(200)

    const expectedResponse = `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
event,${fixtures.eventWithoutTimeSlots.id},[13.06.2019] Event without time slots,1,${fixtures.eventWithoutTimeSlots.price},0
membership,${fixtures.membershipTypeYogaUnlimited.id},${fixtures.membershipTypeYogaUnlimited.name},1,${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount},0
`

    assert.equal(
      responseOctober.text,
      expectedResponse,
    )

    const tokenNovember = jwToken.issue({
        report: {
          periodType: 'month',
          startDate: '2018-11-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const responseNovember = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + tokenNovember,
      )
      .expect(200)

    assert.equal(
      responseNovember.text,
      `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
event,${fixtures.eventWithOneTimeSlot.id},[13.07.2019] Event with one time slot,1,${fixtures.eventWithOneTimeSlot.price},0
event,${fixtures.eventWithMultipleTimeSlots.id},[13.08.2019] Event with multiple time slots,1,${fixtures.eventWithMultipleTimeSlots.price},0
membership,${fixtures.membershipTypeYogaUnlimited.id},${fixtures.membershipTypeYogaUnlimited.name},1,${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount},0
`,
    )

    const tokenDecember = jwToken.issue({
        report: {
          periodType: 'month',
          startDate: '2018-12-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const responseDecember = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + tokenDecember,
      )
      .expect(200)


    assert.equal(
      responseDecember.text,
      `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
class_pass_type,${fixtures.classPassTypeYogaUnlimitedOneMonth.id},${fixtures.classPassTypeYogaUnlimitedOneMonth.name},1,${fixtures.classPassTypeYogaUnlimitedOneMonth.price},0
membership,${fixtures.membershipTypeYogaUnlimited.id},${fixtures.membershipTypeYogaUnlimited.name},1,${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount},0
`,
    )


  })

  it('should return turnover for the specified day', async () => {

    const tokenDecember31 = jwToken.issue({
        report: {
          periodType: 'day',
          startDate: '2018-12-31',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const responseDecember31 = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + tokenDecember31,
      )
      .expect(200)

    assert.equal(
      responseDecember31.text,
      `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
class_pass_type,${fixtures.classPassTypeYogaUnlimitedOneMonth.id},${fixtures.classPassTypeYogaUnlimitedOneMonth.name},1,${fixtures.classPassTypeYogaUnlimitedOneMonth.price},0
`,
    )

    const tokenJanuary1 = jwToken.issue({
        report: {
          periodType: 'day',
          startDate: '2019-01-01',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const responseJanuary1 = await supertest(sails.hooks.http.app)
      .post(
        '/reports/turnover' +
        '?format=csv&reportToken=' + tokenJanuary1,
      )
      .expect(200)


    assert.equal(
      responseJanuary1.text,
      `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
class_pass_type,${fixtures.classPassTypeYogaTenClasses.id},${fixtures.classPassTypeYogaTenClasses.name},1,${fixtures.classPassTypeYogaTenClasses.price},0
product,${fixtures.productYogaMat.id},${fixtures.productYogaMat.name},2,${fixtures.productYogaMat.price * 2},${fixtures.productYogaMat.price * 2 * 0.2}
`,
    )

  })

  it('should return turnover for the specified custom date range', async () => {

    const tokenCustomRange = jwToken.issue({
        report: {
          periodType: 'custom',
          startDate: '2019-02-20',
          endDate: '2019-03-20',
          clientId: testClientId,
        },
        ip: '::ffff:127.0.0.1',
      },
      60,
    )

    const responseCustomRange = await supertest(sails.hooks.http.app)
      .get(
        '/reports/turnover' +
        '?format=csv&reportToken=' + tokenCustomRange,
      )
      .expect(200)

    assert.equal(
      responseCustomRange.text,
      `Type,ID,Navn,Antal betalinger,Omsætning,Heraf moms
class_pass_type,${fixtures.classPassTypeYogaUnlimitedOneMonth.id},${fixtures.classPassTypeYogaUnlimitedOneMonth.name},3,${fixtures.classPassTypeYogaUnlimitedOneMonth.price * 3},0
gift_card_purchase,,,1,250,0
gift_card_spend,,,1,-250,0
membership_no_show_fee,,"Late cancellation fee, Hatha, Saturday Oct 16, 2020",1,25,0
membership_no_show_fee,,"Late cancellation fee, Vinyasa, Friday Oct 15, 2020",2,50,0
product,${fixtures.productYogaShirt.id},${fixtures.productYogaShirt.name},3,${fixtures.productYogaShirt.price * 3},${fixtures.productYogaShirt.price * 3 * 0.2}
`,
    )


  })

})
