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

function strToMins(strTime) {
  const tt = strTime.split(":");
  return parseInt(tt[0]) * 60 + parseInt(tt[1]);
}

function minsToStr(mins) {
  const hh = Math.floor(mins / 60);
  const mm = Math.floor(mins % 60);

  let val =_.padStart(hh, 2, '0') + (hh > 1 ? sails.helpers.t('time.hours') : sails.helpers.t('time.hour'));
  if (mm > 0) {
    val += " " + _.padStart(mm, 2, '0') + (mm > 1 ? sails.helpers.t('time.minutes') : sails.helpers.t('time.minute'));
  }
  return val;
}
// function secToStr(sec) {
//   return [_.padStart(Math.floor(sec / 3600), 2, '0') +
//           sails.helpers.t('time.hours') ,
//           _.padStart(Math.floor((sec % 3600) / 60), 2, '0') +
//           sails.helpers.t('time.minutes') ,
//           _.padStart(sec % 60, 2, '0') +
//           sails.helpers.t('time.seconds')].join(" ");
// }

module.exports = async (req, res) => {

  let reportParams = await sails.helpers.reports.unpackReportToken(req.query.reportToken, req)
  if (!reportParams) return res.forbidden()
  reportParams.fromDate = moment(reportParams.fromDate).format("YYYY-MM-DD");
  reportParams.endDate = moment(reportParams.endDate).format("YYYY-MM-DD");

  const salaryData = await sails.helpers.reports.salary.with(reportParams)

  // Temporary filter until we can remove membership_type and membership_renewal on json requests also
  salaryData.items = _.chain(salaryData.items)
    .filter(item =>
      item.item_type !== 'membership_type' &&
      item.item_type !== 'membership_renewal',
    )
    .sortBy(['item_type', 'event_start_date', 'name'])
    .value()

  const format = req.query.format

  // const fileName = 'Omsætning ' + moment(reportParams.fromDate).format('DD.MM.YYYY') + '-' + moment(reportParams.endDate).format('DD.MM.YYYY') + '.' + format
  const fileName = 'Salary Reports ' + moment(salaryData.fromDate).format('DD.MM.YYYY') + '-' + moment(salaryData.endDate).format('DD.MM.YYYY') + '.' + format

  switch (format) {
    case 'csv':
      const csvContentString = stringify(salaryData.items, {
        header: true,
        columns: [
          {
            key: 'id',
            header: sails.helpers.t('global.ID'),
          },
          {
            key: 'date',
            header: sails.helpers.t('global.Date'),
          },
          {
            key: 'time',
            header: sails.helpers.t('global.Time'),
          },
          {
            key: 'class',
            header: sails.helpers.t('global.Class'),
          },
          {
            key: 'duration',
            header: sails.helpers.t('global.Duration'),
          },
          {
            key: 'signup_count',
            header: sails.helpers.t('global.SignUps'),
          },
          {
            key: 'checkedin_count',
            header: sails.helpers.t('global.CheckedIn'),
          },
          {
            key: 'livestream_signup_count',
            header: sails.helpers.t('global.LivestreamSignups'),
          },
          {
            key: 'room',
            header: sails.helpers.t('global.Room'),
          },
          {
            key: 'teacher_id',
            header: sails.helpers.t('global.TeacherID'),
          },
          {
            key: 'teacher_name',
            header: sails.helpers.t('global.TeacherName'),
          }
          
        ],
      })
      res.attachment(fileName)
      return res.end(csvContentString, 'UTF-8')

    case 'xlsx':
      const styles = {
        headerDark: {
          // fill: {
          //   fgColor: {
          //     rgb: 'FF000000'
          //   }
          // },
          font: {
            color: {
              rgb: 'FF000000'
            },
            sz: 14,
            bold: true,
            // underline: true
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
      
      const heading = [
        [
          sails.helpers.t('global.ID'),
          sails.helpers.t('global.Date'),
          sails.helpers.t('global.Time'),
          sails.helpers.t('global.Class'),
          sails.helpers.t('global.Duration'),
          sails.helpers.t('global.SignUps'),
          sails.helpers.t('global.CheckedIn'),
          sails.helpers.t('global.LivestreamSignups'),
          sails.helpers.t('global.Room')
        ],
      ];
      
      const specification = {
        id: { 
          displayName: sails.helpers.t('global.ID'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        date: { 
          displayName: sails.helpers.t('global.Date'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        time: { 
          displayName: sails.helpers.t('global.Time'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        class: {
          displayName: sails.helpers.t('global.Class'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        duration: { 
          displayName: sails.helpers.t('global.Duration'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        signup_count: {
          displayName: sails.helpers.t('global.SignUps'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        checkedin_count: { 
          displayName: sails.helpers.t('global.CheckedIn'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        livestream_signup_count: {
          displayName: sails.helpers.t('global.LivestreamSignups'),
          headerStyle: styles.headerDark, 
          width: 150 
        },
        room: {
          displayName: sails.helpers.t('global.Room'),
          headerStyle: styles.headerDark, 
          width: 120 
        }
      }

      // const merges = [
      //   { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
      //   { start: { row: 2, column: 1 }, end: { row: 2, column: 5 } },
      //   { start: { row: 2, column: 6 }, end: { row: 2, column: 10 } }
      // ]
     
      const reportData = reportParams.teachers.map(teacher => {
        let subItems = [];
        let total_classes = 0, total_duration = 0, total_signup_count = 0, total_checkedin_count = 0, total_livestream_signup_count = 0
        salaryData.items.map(item => {          
          if (item.teacher_id == teacher.id) {                        
            total_classes++;
            total_duration += strToMins(item.duration);
            total_signup_count += item.signup_count;
            total_checkedin_count += item.checkedin_count;
            total_livestream_signup_count += item.livestream_signup_count;

            subItems.push(item);
            item.duration = minsToStr(strToMins(item.duration));
          }
        })
        if (subItems.length > 0) {
          subItems.push({
            "id": "total: " + subItems.length + " classes",
            "duration": minsToStr(total_duration),
            "signup_count": total_signup_count,
            "checkedin_count": total_checkedin_count,
            "livestream_signup_count": total_livestream_signup_count,
            "room": "",
          })
        } else {
          subItems.push({
            "id": "total:",
            "duration": "",
            "signup_count": "",
            "checkedin_count": "",
            "livestream_signup_count": "",
            "room": "",
          })
        }
        return {
          name: teacher.name, 
          specification: specification, 
          data: subItems,
          merges: [{ start: { row: subItems.length + 1, column: 1 }, end: { row: subItems.length + 1, column: 4 } }]
        };
      })
      const report = excel.buildExport(
        reportData
      );
      
      res.attachment(fileName)
      return res.end(report, 'UTF-8')

    case 'pdf':

      const rows = await sails.helpers.reports.buildPdfDataRows(salaryData.items)

      let receiptTemplatePath = path.resolve(__dirname, '../../../assets/templates/report-salary.ejs')

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
        fromDateFormatted: moment(salaryData.fromDate).format('DD.MM.YYYY'),
        endDateFormatted: moment(salaryData.endDate).format('DD.MM.YYYY'),
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
