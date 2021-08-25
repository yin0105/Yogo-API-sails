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

  // let val =_.padStart(hh, 2, '0') + (hh > 1 ? sails.helpers.t('time.hours') : sails.helpers.t('time.hour'));
  // if (mm > 0) {
  //   val += " " + _.padStart(mm, 2, '0') + (mm > 1 ? sails.helpers.t('time.minutes') : sails.helpers.t('time.minute'));
  // }
  // return val;
  return _.padStart(hh, 2, '0') + ":" + _.padStart(mm, 2, '0')
}

module.exports = async (req, res) => {

  let reportParams = await sails.helpers.reports.unpackReportToken(req.query.reportToken, req)
  if (!reportParams) return res.forbidden()

  reportParams.fromDate = moment(reportParams.fromDate).format("YYYY-MM-DD");
  reportParams.endDate = moment(reportParams.endDate).format("YYYY-MM-DD");

  const classesData = await sails.helpers.reports.classes.with(reportParams)

  // Temporary filter until we can remove membership_type and membership_renewal on json requests also
  classesData.items = _.chain(classesData.items)
    .filter(item =>
      item.item_type !== 'membership_type' &&
      item.item_type !== 'membership_renewal',
    )
    .sortBy(['item_type', 'event_start_date', 'name'])
    .value()

  const format = req.query.format

  // const fileName = 'Omsætning ' + moment(reportParams.fromDate).format('DD.MM.YYYY') + '-' + moment(reportParams.endDate).format('DD.MM.YYYY') + '.' + format
  const fileName = 'Classes Reports ' + moment(classesData.fromDate).format('DD.MM.YYYY') + '-' + moment(classesData.endDate).format('DD.MM.YYYY') + '.' + format

  const settings = await sails.helpers.clientSettings.find.with({
    keys: ['classpass_com_integration_enabled', 'livestream_enabled'],
    client: req.client.id,
    includeSecrets: true,
  })

  const branches = await Branch.find({client: req.client.id, archived: false}).sort('sort ASC').sort('id ASC')
  const bBranches = branches.length > 1 ? true: false;

  let heading = [
    [
      sails.helpers.t('global.ID'),
      sails.helpers.t('global.Date'),
      sails.helpers.t('global.Start'),
      sails.helpers.t('global.End'),
      sails.helpers.t('global.Duration'),
      sails.helpers.t('global.Class'),
      sails.helpers.t('global.Teacher'),
      sails.helpers.t('global.Room'),
      sails.helpers.t('global.Branch'),
      sails.helpers.t('global.PhysicalAttendance'),
      sails.helpers.t('global.Livestream'),
      sails.helpers.t('global.ClasspassEnabled'),
      sails.helpers.t('global.Cancelled'),
      sails.helpers.t('global.SignUps'),
      sails.helpers.t('global.CheckedIn'),
      sails.helpers.t('global.LivestreamSignups'),
      sails.helpers.t('global.ClasspassSignups')
    ],
  ];

  switch (format) {
    case 'csv':
      let reportDataCSV = [];
      classesData.items.map(item => {
        let subItems = [];
        reportParams.teachers.map(teacher => {          
          if (item.teacher_id == teacher.id) {                        
            reportDataCSV.push(item);
          }
        })
      })

      let columns = [
        {
          key: 'id',
          header: sails.helpers.t('global.ID'),
        },
        {
          key: 'date',
          header: sails.helpers.t('global.Date'),
        },
        {
          key: 'start',
          header: sails.helpers.t('global.Start'),
        },
        {
          key: 'end',
          header: sails.helpers.t('global.End'),
        },
        {
          key: 'duration',
          header: sails.helpers.t('global.Duration'),
        },
        {
          key: 'class',
          header: sails.helpers.t('global.Class'),
        },
        {
          key: 'teacher_name',
          header: sails.helpers.t('global.Teacher'),
        },
        {
          key: 'room',
          header: sails.helpers.t('global.Room'),
        },
        {
          key: 'branch',
          header: sails.helpers.t('global.Branch'),
        },
        {
          key: 'physical_attendance',
          header: sails.helpers.t('global.PhysicalAttendance'),
        },
        {
          key: 'livestream',
          header: sails.helpers.t('global.Livestream'),
        },
        {
          key: 'classpass_com_enabled',
          header: sails.helpers.t('global.ClasspassEnabled'),
        },
        {
          key: 'cancelled',
          header: sails.helpers.t('global.Cancelled'),
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
          key: 'classpass_signup_count',
          header: sails.helpers.t('global.ClasspassSignups'),
        },        
      ];

      if (!settings.classpass_com_integration_enabled) columns.splice(16, 1);
      if (!settings.livestream_enabled) columns.splice(15, 1);
      if (!settings.classpass_com_integration_enabled) columns.splice(11, 1);
      if (!settings.livestream_enabled) columns.splice(10, 1);
      if (!settings.livestream_enabled) columns.splice(9, 1);
      if (!bBranches) columns.splice(8, 1);

      const csvContentString = stringify(reportDataCSV, {
        header: true,
        columns: columns,
      })
      res.attachment(fileName)
      return res.end(csvContentString, 'UTF-8')

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
        start: { 
          displayName: sails.helpers.t('global.Start'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        end: { 
          displayName: sails.helpers.t('global.End'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        duration: { 
          displayName: sails.helpers.t('global.Duration'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        class: {
          displayName: sails.helpers.t('global.Class'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        teacher_name: {
          displayName: sails.helpers.t('global.Teacher'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        room: {
          displayName: sails.helpers.t('global.Room'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        branch: {
          displayName: sails.helpers.t('global.Branch'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        physical_attendance: {
          displayName: sails.helpers.t('global.PhysicalAttendance'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        livestream: {
          displayName: sails.helpers.t('global.Livestream'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        classpass_com_enabled: {
          displayName: sails.helpers.t('global.ClasspassEnabled'),
          headerStyle: styles.headerDark, 
          width: 120 
        },
        cancelled: {
          displayName: sails.helpers.t('global.Cancelled'),
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
        classpass_signup_count: {
          displayName: sails.helpers.t('global.ClasspassSignups'),
          headerStyle: styles.headerDark, 
          width: 150 
        },
      }

      if (!settings.classpass_com_integration_enabled) {
        delete specification["classpass_signup_count"];
        delete specification["classpass_com_enabled"];
      }
      if (!settings.livestream_enabled) {
        delete specification["livestream_signup_count"];
        delete specification["livestream"];
        delete specification["physical_attendance"];
      }
      if (!bBranches) delete specification["branch"];
     
      const reportData = reportParams.teachers.map(teacher => {
        let subItems = [];
        let total_classes = 0, total_duration = 0, total_signup_count = 0, total_checkedin_count = 0, total_livestream_signup_count = 0, total_classpass_signup_count = 0;
        classesData.items.map(item => {          
          if (item.teacher_id == teacher.id) {                        
            total_classes++;
            total_duration += strToMins(item.duration);
            total_signup_count += item.signup_count;
            total_checkedin_count += item.checkedin_count;
            total_livestream_signup_count += item.livestream_signup_count;
            total_classpass_signup_count += item.classpass_signup_count;

            subItems.push(item);
            // item.duration = minsToStr(strToMins(item.duration));
          }
        })
        if (subItems.length > 0) {
          subItems.push({
            "id": "total: " + subItems.length + " classes",
            "duration": minsToStr(total_duration),
            "signup_count": total_signup_count,
            "checkedin_count": total_checkedin_count,
            "livestream_signup_count": total_livestream_signup_count,
            "classpass_signup_count": total_classpass_signup_count,
            "room": "",
          })
        } else {
          subItems.push({
            "id": "total:",
            "duration": "",
            "signup_count": "",
            "checkedin_count": "",
            "livestream_signup_count": "",
            "classpass_signup_count": "",
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

      // const rows = await sails.helpers.reports.buildPdfDataRows(classesData.items)

      let receiptTemplatePath = path.resolve(__dirname, '../../../assets/templates/report-classes.ejs')

      const receiptTemplateContent = await readFile(receiptTemplatePath, 'utf-8')

      let reportDataPDF = reportParams.teachers.map(teacher => {
        let subItems = [];
        let total_classes = 0, total_duration = 0, total_signup_count = 0, total_checkedin_count = 0, total_livestream_signup_count = 0, total_classpass_signup_count = 0;
        classesData.items.map(item => {          
          if (item.teacher_id == teacher.id) {                        
            total_classes++;
            total_duration += strToMins(item.duration);
            total_signup_count += item.signup_count;
            total_checkedin_count += item.checkedin_count;
            total_livestream_signup_count += item.livestream_signup_count;
            total_classpass_signup_count += item.classpass_signup_count;

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
            "classpass_signup_count": total_classpass_signup_count,
            "room": "",
          })
        } else {
          subItems.push({
            "id": "total:",
            "duration": "",
            "signup_count": "",
            "checkedin_count": "",
            "livestream_signup_count": "",
            "classpass_signup_count": "",
            "room": "",
          })
        }

        return {
          name: teacher.name, 
          data: subItems,
          merges: [{ start: { row: subItems.length + 1, column: 1 }, end: { row: subItems.length + 1, column: 4 } }],
          // margin: (960 - subItems.length * 16) +  "px"
        };
      });
      // reportDataPDF[reportDataPDF.length - 1].margin = "0px";

      if (!settings.classpass_com_integration_enabled) heading[0].splice(16, 1);
      if (!settings.livestream_enabled) heading[0].splice(15, 1);
      if (!settings.classpass_com_integration_enabled) heading[0].splice(11, 1);
      if (!settings.livestream_enabled) heading[0].splice(10, 1);
      if (!settings.livestream_enabled) heading[0].splice(9, 1);
      if (!bBranches) heading[0].splice(8, 1);

      let html = ejs.render(receiptTemplateContent, {
        fromDateFormatted: moment(classesData.fromDate).format('DD.MM.YYYY'),
        endDateFormatted: moment(classesData.endDate).format('DD.MM.YYYY'),
        heading: heading,
        reportData: reportDataPDF,
        currencyDkk: currencyDkk,
        title: sails.helpers.t('global.ClassReport'), 
        classpass_com_integration_enabled: settings.classpass_com_integration_enabled,
        livestream_enabled: settings.livestream_enabled,
        bBranches: bBranches,
      })

      const pdf = await new Promise((resolve, reject) => {
        htmlToPdf.create(
          html,
          {
            format: 'A4',
            orientation: "landscape",
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
