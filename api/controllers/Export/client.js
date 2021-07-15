const archiver = require('archiver')
const fs = require('fs')
const moment = require('moment-timezone')
const stringify = require('csv-stringify')
const knex = require('../../services/knex')
const {Transform} = require('stream')

const dateTransformerConfig = {
  readableObjectMode: true,
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    const row = _.clone(chunk)
    const transformCols = [
      'date',
      'class.date',
      'start_date',
      'valid_until',
      'cancelled_from_date',
      'paid_until',
      'event.start_date',
    ]
    transformCols.forEach(transformCol => {
      if (row[transformCol]) {
        row[transformCol] = moment(row[transformCol]).format('YYYY-MM-DD', 'Europe/Copenhagen')
      }
    })

    this.push(row)
    callback()
  },
}


module.exports = {
  frinedlyName: 'Export client',

  description: 'Exports all necessary data for migrating client to a new system',

  inputs: {
    reportToken: {
      description: 'The report token',
      type: 'ref',
      required: true,
    },
  },

  fn: async function ({reportToken}, exits) {

    const exportParams = await sails.helpers.reports.unpackReportToken(reportToken, this.req)
    if (!exportParams) {
      console.log('no exportParams')
      throw 'forbidden'
    }

    if (parseInt(exportParams.clientId) !== parseInt(this.req.client.id)) {
      console.log('wrong clientId')
      throw 'forbidden'
    }

    if (exportParams.export !== 'client') {
      console.log('export !== client')
      throw 'forbidden'
    }


    const zipFileName = this.req.client.name.replace(/ /g, '_') + '_YOGO_EXPORT_' + moment.tz('Europe/Copenhagen').format('YYYY-MM-DD_HH-mm-ss') + '.zip'

    const zipFileNameWithPath = '/tmp/' + zipFileName

    const outputFileStream = fs.createWriteStream(zipFileNameWithPath)

    const archive = archiver('zip', {
      zlib: {level: 9}, // Sets the compression level.
    })

    outputFileStream.on('end', function () {
      console.log('Data has been drained')
    })

    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        console.log(err.message)
      } else {
        throw err
      }
    })

    archive.on('error', function (err) {
      throw err
    })

    archive.pipe(outputFileStream)


    const exportTables = [
      {
        model: User,
        where: {
          client: this.req.client.id,
          archived: false,
        },
        cols: [
          'id',
          'email',
          'first_name',
          'last_name',
          'address_1',
          'address_2',
          'zip_code',
          'country',
          'phone',
          'customer',
          'admin',
          'teacher',
        ],
      },
      {
        model: MembershipType,
        where: {
          client: this.req.client.id,
          archived: false,
        },
        cols: [
          'id',
          'name',
        ],
      },
      {
        model: MembershipTypePaymentOption,
        where: {
          client: this.req.client.id,
          membership_type: {'>': 0},
        },
        cols: [
          'id',
          'membership_type',
          'number_of_months_payment_covers',
          'name',
          'payment_amount',
        ],
      },
      {
        model: PaymentSubscription,
        where: {
          client: this.req.client.id,
          status: ['active', 'payment_failed'],
          archived: false,
          membership: {'>': 0},
        },
        cols: [
          'id',
          'membership',
          'payment_provider_subscription_id',
          'status',
          'pay_type',
          'card_last_4_digits',
          'card_expiration',
          'card_nomask',
          'card_prefix',

        ],
      },
      {
        model: ClassPassType,
        where: {
          client: this.req.client.id,
          archived: false,
        },
        cols: [
          'id',
          'name',
          'pass_type',
          'number_of_classes',
          'days',
          'price',

        ],
      },
      {
        model: Class,
        where: {
          client: this.req.client.id,
          archived: false,
          date: {'>=': moment().tz('Europe/Copenhagen').startOf('day').toDate()},
        },
        cols: [
          'id',
          'class_type',
          'subtitle',
          'date',
          'start_time',
          'end_time',
          'seats',
          'cancelled',
        ],
      },
      {
        model: ClassType,
        where: {
          client: this.req.client.id,
          archived: false,
        },
        cols: [
          'id',
          'name',
        ],
      },
      {
        model: Event,
        where: {
          client: this.req.client.id,
          archived: false,
          start_date: {'>=': moment().tz('Europe/Copenhagen').startOf('day').toDate()},
        },
        cols: [
          'id',
          'name',
          'start_date',
          'seats',
          'price',
        ],
      },

    ]

    for (let i = 0; i < exportTables.length; i++) {
      const exportTable = exportTables[i]
      const stringifier = stringify({
        header: true,
        columns: _.map(exportTable.cols, col => {
          return {key: col}
        }),
      })

      stringifier.on('error', function (err) {
        console.error(err.message)
      })

      archive.append(stringifier, {name: exportTable.model.tableName + '.csv'})

      const dateTransformer = new Transform(dateTransformerConfig)

      dateTransformer.pipe(stringifier)

      await exportTable.model.stream({
        where: exportTable.where,
        select: exportTable.cols,
      }).eachRecord(async row => {
        dateTransformer.write(row)
      })

      dateTransformer.end()

    }

    const today = moment.tz('Europe/Copenhagen').startOf('day')

    const knexExportTables = [
      {
        tableName: 'class_signup',
        query: knex({cs: 'class_signup'})
          .select({
            id: 'cs.id',
            user: 'cs.user',
            'user.email': 'u.email',
            'user.first_name': 'u.first_name',
            'user.last_name': 'u.last_name',
            'class': 'cs.class',
            'class.class_type.name': 'ct.name',
            'class.date': 'c.date',
            'class.start_time': 'c.start_time',
            used_membership: 'cs.used_membership',
            'used_membership.name': 'mt.name',
            used_class_pass: 'cs.used_class_pass',
            'used_class_pass.name': 'cpt.name',
          })
          .innerJoin({c: 'class'}, 'cs.class', 'c.id')
          .innerJoin({ct: 'class_type'}, 'c.class_type', 'ct.id')
          .innerJoin({u: 'user'}, 'cs.user', 'u.id')
          .leftJoin({m: 'membership'}, 'cs.used_membership', 'm.id')
          .leftJoin({mt: 'membership_type'}, 'm.membership_type', 'mt.id')
          .leftJoin({cp: 'class_pass'}, 'cs.used_class_pass', 'cp.id')
          .leftJoin({cpt: 'class_pass_type'}, 'cp.class_pass_type', 'cpt.id')
          .where('c.date', '>=', today.toDate())
          .andWhere('c.archived', false)
          .andWhere('cs.archived', false)
          .andWhere('cs.cancelled_at', 0)
          .andWhere('cs.client', this.req.client.id)
          .andWhere('c.client', this.req.client.id),
        cols: [
          'id',
          'user',
          'user.email',
          'user.first_name',
          'user.last_name',
          'class',
          'class.class_type.name',
          'class.date',
          'class.start_time',
          'used_membership',
          'used_membership.name',
          'used_class_pass',
          'used_class_pass.name',
        ],
      },
      {
        tableName: 'event_signup',
        query: knex({es: 'event_signup'})
          .select({
            id: 'es.id',
            user: 'es.user',
            'user.email': 'u.email',
            'user.first_name': 'u.first_name',
            'user.last_name': 'u.last_name',
            event: 'es.event',
            'event.start_date': 'e.start_date',
            'event.name': 'e.name',
          })
          .innerJoin({e: 'event'}, 'es.event', 'e.id')
          .innerJoin({u: 'user'}, 'es.user', 'u.id')
          .where('e.start_date', '>=', today.toDate())
          .andWhere('es.client', this.req.client.id)
          .andWhere('e.client', this.req.client.id)
          .andWhere('es.archived', false)
          .andWhere('e.archived', false),
        cols: [
          'id',
          'user',
          'user.email',
          'user.first_name',
          'user.last_name',
          'event',
          'event.start_date',
          'event.name',
        ],
      },
      {
        tableName: 'membership',
        query: knex({m: 'membership'})
          .select({
            id: 'm.id',
            user: 'user',
            'user.email': 'u.email',
            'user.first_name': 'u.first_name',
            'user.last_name': 'u.last_name',
            'user.address_1': 'u.address_1',
            'user.address_2': 'u.address_2',
            'user.zip_code': 'u.zip_code',
            'user.country': 'u.country',
            'user.phone': 'u.phone',
            membership_type: 'm.membership_type',
            'membership_type.name': 'mt.name',
            status: 'm.status',
            renewal_failed: 'renewal_failed',
            paid_until: 'paid_until',
            start_date: 'start_date',
            cancelled_from_date: 'cancelled_from_date',
            payment_option: 'payment_option',
            'payment_option.name': 'mtpo.name',
            dibs_token: 'ps.payment_provider_subscription_id',
            real_user_is_someone_else: 'real_user_is_someone_else',
            real_user_name: 'real_user_name',
          })
          .innerJoin({mt: 'membership_type'}, 'm.membership_type', '=', 'mt.id')
          .innerJoin({u: 'user'}, 'm.user', '=', 'u.id')
          .innerJoin({mtpo: 'membership_type_payment_option'}, 'm.payment_option', '=', 'mtpo.id')
          .innerJoin({ps: 'payment_subscription'}, 'm.id', '=', 'ps.membership')
          .where('m.client', this.req.client.id)
          .where('m.archived', false)
          .whereIn('m.status', ['active', 'cancelled_running'])
          .where('ps.status', 'active'),

        cols: [
          'id',
          'user',
          'user.email',
          'user.first_name',
          'user.last_name',
          'user.address_1',
          'user.address_2',
          'user.zip_code',
          'user.country',
          'user.phone',
          'membership_type',
          'membership_type.name',
          'status',
          'renewal_failed',
          'paid_until',
          'start_date',
          'cancelled_from_date',
          'payment_option',
          'payment_option.name',
          'dibs_token',
          'real_user_is_someone_else',
          'real_user_name',
        ],
      },
      {
        tableName: 'class_pass',
        query: knex({cp: 'class_pass'})
          .select({
            id: 'cp.id',
            user: 'user',
            'user.email': 'u.email',
            'user.first_name': 'u.first_name',
            'user.last_name': 'u.last_name',
            'user.address_1': 'u.address_1',
            'user.address_2': 'u.address_2',
            'user.zip_code': 'u.zip_code',
            'user.country': 'u.country',
            'user.phone': 'u.phone',
            class_pass_type: 'cp.class_pass_type',
            'class_pass_type.name': 'cpt.name',
            classes_left: 'cp.classes_left',
            valid_until: 'valid_until',
            start_date: 'start_date',
          })
          .innerJoin({cpt: 'class_pass_type'}, 'cp.class_pass_type', '=', 'cpt.id')
          .innerJoin({u: 'user'}, 'cp.user', '=', 'u.id')
          .where('cp.client', this.req.client.id)
          .where('cp.archived', false)
          .where('cp.valid_until', '>=', moment().tz('Europe/Copenhagen').format('YYYY-MM-DD')),
        cols: [
          'id',
          'user',
          'user.email',
          'user.first_name',
          'user.last_name',
          'user.address_1',
          'user.address_2',
          'user.zip_code',
          'user.country',
          'user.phone',
          'class_pass_type',
          'class_pass_type.name',
          'classes_left',
          'valid_until',
          'start_date',
        ],
      },
    ]

    for (let i = 0; i < knexExportTables.length; i++) {
      await new Promise((resolve) => {

        const exportTable = knexExportTables[i]
        const stringifier = stringify({
          header: true,
          columns: exportTable.cols.map(col => {
            return {key: col}
          }),
        })

        archive.append(stringifier, {name: exportTable.tableName + '.csv'})

        const stream = exportTable.query.stream()

        stream.on('error', err => {
          console.log(err.message)
        })

        const dateTransformer = new Transform(dateTransformerConfig)

        stream.pipe(dateTransformer).pipe(stringifier)

        stringifier.on('error', function (err) {
          console.error(err.message)
        })

        stringifier.on('finish', function () {
          resolve()
        })

      })
    }

    outputFileStream.on('finish', () => {
      const stream = fs.createReadStream(zipFileNameWithPath)

      this.res.attachment(zipFileName)
      return exits.success(stream)
    })

    archive.finalize()

  },

}
