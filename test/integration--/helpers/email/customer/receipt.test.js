const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const sinon = require('sinon')
const moment = require('moment-timezone')
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory');
const pdfReceiptFakeFactory = require('../../../../fakes/pdf-receipt-fake-factory');

describe('helpers.email.customer.receipt', async () => {

  let emailSendFake,
    pdfReceiptFake,
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

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();
    await ClientSettings.destroy({})

  })

  afterEach(() => {
    sinon.restore()
  })

  after(async () => {
    await Order.destroy({id: order.id})
    await OrderItem.destroy({id: orderItem.id})
  })

  it('should send a receipt in English', async () => {

    pdfReceiptFake = pdfReceiptFakeFactory.installPdfReceiptFake('Receipt from Test client.pdf');

    await sails.helpers.email.customer.receipt(order)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userAlice.id}, ...},
      non_user_email: '',
      client: {id: ${testClientId}, ...},
      subject: 'Receipt from Test client',
      text: 'Dear Alice,\\n\\nThanks for your purchase. This is your receipt.\\n\\nKind regards,\\nTest client',
      attachments: [
        {
          filename: 'Receipt from Test client.pdf',
          ...
        }
      ],
      blindCopyToClient: true,
      emailType: 'receipt'
    }`)

  })

  it('should send a receipt in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch()

    pdfReceiptFake = pdfReceiptFakeFactory.installPdfReceiptFake('Kvittering fra Test client.pdf');

    await sails.helpers.email.customer.receipt(order)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userAlice.id}, ...},
      non_user_email: '',
      client: {id: ${testClientId}, ...},
      subject: 'Kvittering fra Test client',
      text: 'Kære Alice\\n\\nTak for dit køb. Din kvittering er vedhæftet.\\n\\nVenlig hilsen\\nTest client',
      attachments: [
        {
          filename: 'Kvittering fra Test client.pdf',
          ...
        }
      ],
      blindCopyToClient: true,
      emailType: 'receipt'
    }`)

    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

})
