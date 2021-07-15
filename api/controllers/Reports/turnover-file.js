const stringify = require('csv-stringify/lib/sync') // Sync API
const moment = require('moment')
const htmlToPdf = require('html-pdf')
const path = require('path')
const ejs = require('ejs')
moment.locale('da')
const currencyDkk = require('../../filters/currency_dkk')

const {promisify} = require('util')
const fs = require('fs')

const readFile = promisify(fs.readFile)

module.exports = async (req, res) => {

  const reportParams = await sails.helpers.reports.unpackReportToken(req.query.reportToken, req)
  if (!reportParams) return res.forbidden()


  const turnoverData = await sails.helpers.reports.turnover.with(reportParams)

  // Temporary filter until we can remove membership_type and membership_renewal on json requests also
  turnoverData.items = _.chain(turnoverData.items)
    .filter(item =>
      item.item_type !== 'membership_type' &&
      item.item_type !== 'membership_renewal',
    )
    .sortBy(['item_type', 'event_start_date', 'name'])
    .value()

  const format = req.query.format

  const fileName = 'Omsætning ' + moment(turnoverData.startDate).format('DD.MM.YYYY') + '-' + moment(turnoverData.endDate).format('DD.MM.YYYY') + '.' + format

  switch (format) {
    case 'csv':
      const csvContentString = stringify(turnoverData.items, {
        header: true,
        columns: [
          {
            key: 'item_type',
            header: 'Type',
          },
          {
            key: 'item_id',
            header: 'ID',
          },
          {
            key: 'name',
            header: 'Navn',
          },
          {
            key: 'item_count',
            header: 'Antal betalinger',
          },
          {
            key: 'turnover',
            header: 'Omsætning',
          },
          {
            key: 'vat_amount',
            header: 'Heraf moms',
          },
        ],
      })
      res.attachment(fileName)
      return res.end(csvContentString, 'UTF-8')

    case 'pdf':

      const rows = await sails.helpers.reports.buildPdfDataRows(turnoverData.items)

      let receiptTemplatePath = path.resolve(__dirname, '../../../assets/templates/report-turnover.ejs')

      const receiptTemplateContent = await readFile(receiptTemplatePath, 'utf-8')

      const clientLogoUrl = req.client.logo ?
        await sails.helpers.images.url.with({
          image: req.client.logo,
          width: 200,
          height: 200,
        }) :
        null

      const clientLogoImgTagClass = clientLogoUrl.indexOf('.svg') > -1 ? 'svg' : 'bitmap'

      let html = ejs.render(receiptTemplateContent, {
        startDateFormatted: moment(turnoverData.startDate).format('DD.MM.YYYY'),
        endDateFormatted: moment(turnoverData.endDate).format('DD.MM.YYYY'),
        rows: rows,
        clientLogoUrl: clientLogoUrl,
        clientLogoImgTagClass: clientLogoImgTagClass,
        currencyDkk: currencyDkk,
      })

      const pdf = await new Promise((resolve, reject) => {
        htmlToPdf.create(
          html,
          {
            format: 'A4',
            border:0,
            header: {
              "height": "10mm",
              "contents": '',
            },
            footer: {
              "height": "10mm",
              "contents": '',
            },
          },
        ).toBuffer(async (err, receiptPdfBuffer) => {

          if (err) reject(err)

          resolve(receiptPdfBuffer)
        })

      })

      res.attachment(fileName)
      return res.end(pdf, 'UTF-8')


    default:
      throw new Error('Invalid report format')

  }


}
