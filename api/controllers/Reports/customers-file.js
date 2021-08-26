const stringify = require('csv-stringify/lib/sync'); // Sync API
const moment = require('moment-timezone');
const htmlToPdf = require('html-pdf');
const path = require('path');
const ejs = require('ejs');
moment.locale('da');
const currencyDkk = require('../../filters/currency_dkk');

const {promisify} = require('util');
const fs = require('fs');

const readFile = promisify(fs.readFile);

module.exports = async (inputs, exits, format, req, res) => {

  const reportParams = await sails.helpers.reports.unpackReportToken(req.query.reportToken, req);
  if (!reportParams) return exits.forbidden();

  const customers = await sails.helpers.reports.customers.with({
    client: req.client,
    onlyActiveCustomers: reportParams.onlyActiveCustomers,
    onlyInactiveCustomers: reportParams.onlyInactiveCustomers,
  });

  const todayIsoDate = moment.tz('Europe/Copenhagen').format('DD.MM.YYYY');

  const fileName = reportParams.onlyActiveCustomers
    ? `Aktive kunder ${todayIsoDate}.${format}`
    : (
      reportParams.onlyInactiveCustomers
        ? `Inaktive kunder ${todayIsoDate}.${format}`
        : `Alle kunder ${todayIsoDate}.${format}`
    );

  console.log("format = ", format)

  switch (format) {
    case 'csv':
      const csvContentString = stringify(customers, {
        header: true,
        columns: [
          {
            key: 'email',
            header: 'E-mail',
          },
          {
            key: 'first_name',
            header: 'Fornavn',
          },
          {
            key: 'last_name',
            header: 'Efternavn',
          },
        ],
      });
      res.attachment(fileName);
      return res.end(csvContentString, 'UTF-8');

    case 'xlsx':
      const styles = {
        headerDark: {
          font: {
            color: {
              rgb: 'FF000000'
            },
            sz: 14,
            bold: true,
          }
        },
        cellPink: {
          fill: {
            fgColor: {
              rgb: 'FFFFCCFF'
            }
          }
        },
        cellGreen: {
          fill: {
            fgColor: {
              rgb: 'FF00FF00'
            }
          }
        }
      };
                  
      const specification = {
        email: { 
          displayName: 'E-mail',
          headerStyle: styles.headerDark, 
          width: 120 
        },
        first_name: { 
          displayName: 'Fornavn',
          headerStyle: styles.headerDark, 
          width: 120 
        },
        last_name: { 
          displayName: 'Efternavn',
          headerStyle: styles.headerDark, 
          width: 120 
        },
      }
      
      // const reportData = reportParams.teachers.map(teacher => {
      //   let subItems = [];
      //   let total_classes = 0, total_duration = 0, total_signup_count = 0, total_checkedin_count = 0, total_livestream_signup_count = 0, total_classpass_signup_count = 0;
      //   classesData.items.map(item => {          
      //     if (item.teacher_id == teacher.id) {                        
      //       total_classes++;
      //       total_duration += strToMins(item.duration);
      //       total_signup_count += item.signup_count;
      //       total_checkedin_count += item.checkedin_count;
      //       total_livestream_signup_count += item.livestream_signup_count;
      //       total_classpass_signup_count += item.classpass_signup_count;

      //       subItems.push(item);
      //       // item.duration = minsToStr(strToMins(item.duration));
      //     }
      //   })
      //   if (subItems.length > 0) {
      //     subItems.push({
      //       "id": "total: " + subItems.length + " classes",
      //       "duration": minsToStr(total_duration),
      //       "signup_count": total_signup_count,
      //       "checkedin_count": total_checkedin_count,
      //       "livestream_signup_count": total_livestream_signup_count,
      //       "classpass_signup_count": total_classpass_signup_count,
      //       "room": "",
      //     })
      //   } else {
      //     subItems.push({
      //       "id": "total:",
      //       "duration": "",
      //       "signup_count": "",
      //       "checkedin_count": "",
      //       "livestream_signup_count": "",
      //       "classpass_signup_count": "",
      //       "room": "",
      //     })
      //   }

      //   return {
      //     name: teacher.name, 
      //     specification: specification, 
      //     data: subItems,
      //     merges: [{ start: { row: subItems.length + 1, column: 1 }, end: { row: subItems.length + 1, column: 4 } }]
      //   };
      // })
      // const report = excel.buildExport(
      //   [{
      //     name: "customers", 
      //     specification: specification, 
      //     data: customers,
      //     merges: [],
      //     // merges: [{ start: { row: subItems.length + 1, column: 1 }, end: { row: subItems.length + 1, column: 4 } }]
      //   }]
      // );

      // console.log("report = ", report)
      
      // res.attachment(fileName)
      // return res.end(report, 'UTF-8')

    /*case 'pdf':

      const rows = await sails.helpers.reports.buildPdfDataRows(customers.items)

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
        startDateFormatted: moment(customers.startDate).format('DD.MM.YYYY'),
        endDateFormatted: moment(customers.endDate).format('DD.MM.YYYY'),
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
*/

    default:
      throw new Error('Invalid report format');

  }


};
