const path = require('path')
const ejs = require('ejs')
const pdf = require('html-pdf')
const fs = require('await-fs')

const payTypeFilter = require('../../filters/pay_type')
const currencyDkk = require('../../filters/currency_dkk')

module.exports = {
  friendlyName: 'Create a pdf-receipt',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)

    const order = await Order.findOne(orderId)
      .populate('client')
      .populate('user')
      .populate('order_items')

    const clientLogoUrl = await sails.helpers.images.url.with({
      image: order.client.logo,
      width: 600,
      height: 600,
    })
      .tolerate(() => null)

    let receiptTemplatePath = path.resolve(__dirname, '../../../assets/templates/pdf-receipt.ejs')

    const receiptTemplateContent = await fs.readFile(receiptTemplatePath, 'utf-8')

    const translatedStrings = _.chain(
      [
        'invoice_id',
        'date',
        'product',
        'price',
        'total',
        'included_vat',
        'payment_method',
      ]).keyBy().mapValues(
      key => sails.helpers.t('receipt.' + key),
    ).value()

    const locale = await sails.helpers.clientSettings.find(order.client, 'locale')

    let receiptHtml = ejs.render(receiptTemplateContent, {
      order: order,
      clientLogoUrl: clientLogoUrl,
      imageServer: sails.config.IMAGE_SERVER,
      currencyDkk: currencyDkk,
      payTypeFilter: payTypeFilter,
      invoiceDate: sails.helpers.util.formatDate.with({
        date: order.paid,
        locale: locale,
        includeWeekday: false,
      }),
      translatedStrings: translatedStrings,
    })

    pdf.create(receiptHtml).toBuffer(async (err, receiptPdfBuffer) => {

      if (err) {
        return exits.error(err)
      }

      let filename = await sails.helpers.clientSettings.find(order.client, 'receipt_pdf_filename')
      filename = await sails.helpers.string.fillInVariables(filename, {studio_name: order.client.name})

      return exits.success({
        pdfBuffer: receiptPdfBuffer,
        filename: filename,
      })

    })

  },

}
