const stringify = require('csv-stringify/lib/sync') // Sync API
const moment = require('moment')
const htmlToPdf = require('html-pdf')
const path = require('path')
const ejs = require('ejs')
moment.locale('da')
const currencyDkk = require('../../filters/currency_dkk')

const {promisify} = require('util')
const fs = require('fs')
const excel = require('node-excel-export');

const readFile = promisify(fs.readFile)

// function strToMins(strTime) {
//   const tt = strTime.split(":");
//   return parseInt(tt[0]) * 60 + parseInt(tt[1]);
// }

// function minsToStr(mins) {
//   const hh = Math.floor(mins / 60);
//   const mm = Math.floor(mins % 60);

//   let val =_.padStart(hh, 2, '0') + (hh > 1 ? sails.helpers.t('time.hours') : sails.helpers.t('time.hour'));
//   if (mm > 0) {
//     val += " " + _.padStart(mm, 2, '0') + (mm > 1 ? sails.helpers.t('time.minutes') : sails.helpers.t('time.minute'));
//   }
//   return val;
// }

module.exports = async (req, res) => {

  let reportParams = await sails.helpers.reports.unpackReportToken(req.query.reportToken, req)
  if (!reportParams) return res.forbidden()
  reportParams.startDate = moment(reportParams.startDate).format("YYYY-MM-DD");
  reportParams.endDate = moment(reportParams.endDate).format("YYYY-MM-DD");

  console.log("reportParams = ", reportParams);

  const ordersData = await sails.helpers.reports.orders.with(reportParams)
  console.log("ordersData = ", ordersData);

  // Temporary filter until we can remove membership_type and membership_renewal on json requests also
//   ordersData.items = _.chain(ordersData.items)
//     .filter(item =>
//       item.item_type !== 'membership_type' &&
//       item.item_type !== 'membership_renewal',
//     )
//     .sortBy(['item_type', 'event_start_date', 'name'])
//     .value()

//   const format = req.query.format

//   // const fileName = 'Omsætning ' + moment(reportParams.startDate).format('DD.MM.YYYY') + '-' + moment(reportParams.endDate).format('DD.MM.YYYY') + '.' + format
  const fileName = 'Sales Report ' + moment(ordersData.startDate).format('DD.MM.YYYY') + '-' + moment(ordersData.endDate).format('DD.MM.YYYY') + '.' + format

  const heading = [
    [
      sails.helpers.t('sales.InvoiceDateTime'),
      sails.helpers.t('sales.Invoice#'),      
      sails.helpers.t('sales.CustomerID'),
      sails.helpers.t('sales.CustomerName'),
      sails.helpers.t('sales.CustomerEmail'),
      sails.helpers.t('sales.Text'),
      sails.helpers.t('sales.ItemType'),
      sails.helpers.t('sales.ItemID'),
      sails.helpers.t('sales.Quantity'),
      sails.helpers.t('sales.ItemPrice'),
      sails.helpers.t('sales.TotalPrice'),
      sails.helpers.t('sales.VatAmount'),
      sails.helpers.t('sales.PaymentServiceProvider'),
      sails.helpers.t('sales.PaymentMethod'),
      sails.helpers.t('sales.MaskedCard'),
      sails.helpers.t('sales.InvoiceTotal'),
    ],
  ];

//   switch (format) {
//     case 'xlsx':
//       const styles = {
//         headerDark: {
//           // fill: {
//           //   fgColor: {
//           //     rgb: 'FF000000'
//           //   }
//           // },
//           font: {
//             color: {
//               rgb: 'FF000000'
//             },
//             sz: 14,
//             bold: true,
//             // underline: true
//           }
//         },
//         cellPink: {
//           fill: {
//             fgColor: {
//               rgb: 'FFFFCCFF'
//             }
//           }
//         },
//         cellGreen: {
//           fill: {
//             fgColor: {
//               rgb: 'FF00FF00'
//             }
//           }
//         }
//       };
                  
//       const specification = {
//         id: { 
//           displayName: sails.helpers.t('global.ID'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         },
//         date: { 
//           displayName: sails.helpers.t('global.Date'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         },
//         time: { 
//           displayName: sails.helpers.t('global.Time'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         },
//         class: {
//           displayName: sails.helpers.t('global.Class'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         },
//         duration: { 
//           displayName: sails.helpers.t('global.Duration'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         },
//         signup_count: {
//           displayName: sails.helpers.t('global.SignUps'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         },
//         checkedin_count: { 
//           displayName: sails.helpers.t('global.CheckedIn'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         },
//         livestream_signup_count: {
//           displayName: sails.helpers.t('global.LivestreamSignups'),
//           headerStyle: styles.headerDark, 
//           width: 150 
//         },
//         room: {
//           displayName: sails.helpers.t('global.Room'),
//           headerStyle: styles.headerDark, 
//           width: 120 
//         }
//       }

//       // const merges = [
//       //   { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
//       //   { start: { row: 2, column: 1 }, end: { row: 2, column: 5 } },
//       //   { start: { row: 2, column: 6 }, end: { row: 2, column: 10 } }
//       // ]
     
//       const reportData = reportParams.teachers.map(teacher => {
//         let subItems = [];
//         let total_classes = 0, total_duration = 0, total_signup_count = 0, total_checkedin_count = 0, total_livestream_signup_count = 0
//         ordersData.items.map(item => {          
//           if (item.teacher_id == teacher.id) {                        
//             total_classes++;
//             total_duration += strToMins(item.duration);
//             total_signup_count += item.signup_count;
//             total_checkedin_count += item.checkedin_count;
//             total_livestream_signup_count += item.livestream_signup_count;

//             subItems.push(item);
//             item.duration = minsToStr(strToMins(item.duration));
//           }
//         })
//         if (subItems.length > 0) {
//           subItems.push({
//             "id": "total: " + subItems.length + " classes",
//             "duration": minsToStr(total_duration),
//             "signup_count": total_signup_count,
//             "checkedin_count": total_checkedin_count,
//             "livestream_signup_count": total_livestream_signup_count,
//             "room": "",
//           })
//         } else {
//           subItems.push({
//             "id": "total:",
//             "duration": "",
//             "signup_count": "",
//             "checkedin_count": "",
//             "livestream_signup_count": "",
//             "room": "",
//           })
//         }
//         return {
//           name: teacher.name, 
//           specification: specification, 
//           data: subItems,
//           merges: [{ start: { row: subItems.length + 1, column: 1 }, end: { row: subItems.length + 1, column: 4 } }]
//         };
//       })
//       const report = excel.buildExport(
//         reportData
//       );
      
//       res.attachment(fileName)
//       return res.end(report, 'UTF-8')

//     default:
//       throw new Error('Invalid report format')

//   }


}
