const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const {assert} = require('chai')

const fixtures = require('../../../fixtures/factory').fixtures

const moment = require('moment')
const pdfParse = require('pdf-parse')

describe('helpers.order.pdf-receipt', async () => {

  let
    order,
    orderItem

  before(async () => {
    order = await Order.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      paid: moment.tz('2020-02-24 12:00:00', 'Europe/Copenhagen').format('x'),
      invoice_id: 10,
    }).fetch()

    orderItem = await OrderItem.create({
      order: order.id,
      client: testClientId,
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaTenClasses.id,
      name: 'Yoga ti klasser',
      count: 1,
      item_price: 500,
      total_price: 500,
      vat_amount: 0,
    }).fetch()

  })

  after(async () => {
    await Order.destroy({id: order.id})
    await OrderItem.destroy({id: orderItem.id})
  })

  it('should generate a receipt in English', async () => {
    const {filename, pdfBuffer} = await sails.helpers.order.pdfReceipt(order)

    assert.strictEqual(
      filename,
      'Receipt from Test client.pdf',
    )

    console.log('pdfBuffer:', pdfBuffer)
    await new Promise(resolve => {
      pdfParse(pdfBuffer).then(data => {
        console.log('data:', data)
        assert.match(data.text, /Invoice no\.:/)
        assert.match(data.text, /Date: February 24, 2020/)
        assert.match(data.text, /CVR:/)
        assert.match(data.text, /Product/)
        assert.match(data.text, /Price/)
        assert.match(data.text, /Total/)
        assert.match(data.text, /Included VAT:/)
        assert.match(data.text, /Payment method/)
        resolve()
      })

    })

  })

  it('should generate a receipt in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch()
    sails.yogo = {
      locale: 'da'
    }

    const {filename, pdfBuffer} = await sails.helpers.order.pdfReceipt(order)

    assert.strictEqual(
      filename,
      'Kvittering fra Test client.pdf',
    )

    await new Promise(resolve => {
      pdfParse(pdfBuffer).then(data => {
        assert.match(data.text, /Fakturanr\.:/)
        assert.match(data.text, /Dato: 24. februar 2020/)
        assert.match(data.text, /CVR:/)
        assert.match(data.text, /Produkt/)
        assert.match(data.text, /Pris/)
        assert.match(data.text, /Total/)
        assert.match(data.text, /Heraf moms:/)
        assert.match(data.text, /Betalingsmetode/)
        resolve()
      })

    })

    await ClientSettings.destroy({id: clientSettingsRow.id})
    delete sails.yogo

  })

})
