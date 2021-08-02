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

module.exports = async (req, res) => {

let reportParams = await sails.helpers.reports.unpackReportToken(req.query.reportToken, req)
if (!reportParams) return res.forbidden()
reportParams.startDate = moment(reportParams.startDate).format("YYYY-MM-DD");
reportParams.endDate = moment(reportParams.endDate).format("YYYY-MM-DD");

const ordersData = await sails.helpers.reports.orders.with(reportParams)
const format = req.query.format
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

switch (format) {
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
                
    const specification = {
        paid: { 
            displayName: sails.helpers.t('sales.InvoiceDateTime'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        invoice_id: { 
            displayName: sails.helpers.t('sales.Invoice#'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        user_id: { 
            displayName: sails.helpers.t('sales.CustomerID'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        user_name: { 
            displayName: sails.helpers.t('sales.CustomerName'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        user_email: { 
            displayName: sails.helpers.t('sales.CustomerEmail'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        item_name: { 
            displayName: sails.helpers.t('sales.Text'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        item_type: { 
            displayName: sails.helpers.t('sales.ItemType'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        item_id: { 
            displayName: sails.helpers.t('sales.ItemID'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        item_count: { 
            displayName: sails.helpers.t('sales.Quantity'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        item_price: { 
            displayName: sails.helpers.t('sales.ItemPrice'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        item_total_price: { 
            displayName: sails.helpers.t('sales.TotalPrice'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        item_vat_amount: { 
            displayName: sails.helpers.t('sales.VatAmount'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        payment_service_provider: { 
            displayName: sails.helpers.t('sales.PaymentServiceProvider'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        pay_type: { 
            displayName: sails.helpers.t('sales.PaymentMethod'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        masked_card: { 
            displayName: sails.helpers.t('sales.MaskedCard'),
            headerStyle: styles.headerDark, 
            width: 120 
        },
        total: { 
            displayName: sails.helpers.t('sales.InvoiceTotal'),
            headerStyle: styles.headerDark, 
            width: 120 
        },

    }

    // const merges = [
    //   { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
    //   { start: { row: 2, column: 1 }, end: { row: 2, column: 5 } },
    //   { start: { row: 2, column: 6 }, end: { row: 2, column: 10 } }
    // ]
    let subItems = []
    ordersData.items.map(item => {          
        subItems.push(item);

        // return {
        //     name: "Sales", 
        //     specification: specification, 
        //     data: subItems,
        // //   merges: [{ start: { row: subItems.length + 1, column: 1 }, end: { row: subItems.length + 1, column: 4 } }]
        // };
    })

    const reportData = {
        name: "Sales", 
        specification: specification, 
        data: subItems,
    //   merges: [{ start: { row: subItems.length + 1, column: 1 }, end: { row: subItems.length + 1, column: 4 } }]
    };
    const report = excel.buildExport(
        [reportData]
    );
    
    res.attachment(fileName)
    return res.end(report, 'UTF-8')

    default:
    throw new Error('Invalid report format')

}


}
