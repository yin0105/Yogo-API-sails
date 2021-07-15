const moment = require('moment-timezone');

const activeMembershipSubquery = function () {
  this.select('m.id').from('membership as m')
    .where('m.status', 'in', ['active', 'cancelled_running'])
    .andWhere({
      'm.archived': 0,
      'm.user': knex.raw("u.id"),
    })
    .limit(1);
};

const activeClassPassSubquery = function () {
  const todayIsoDate = moment.tz('Europe/Copenhagen').format('YYYY-MM-DD');

  this.select('cp.id').from('class_pass as cp')
    .innerJoin({cpt: 'class_pass_type'}, 'cp.class_pass_type', 'cpt.id')
    .where({
      'cp.archived': 0,
      'cp.user': knex.raw('u.id'),
    })
    .andWhere('cp.valid_until', '>=', todayIsoDate)
    .andWhere(classPassTypeBuilder => classPassTypeBuilder
      .where('cpt.pass_type', 'unlimited')
      .orWhere('cp.classes_left', '>', 0),
    )
    .limit(1);
};

const activeEventSignupSubquery = function () {
  const todayIsoDate = moment.tz('Europe/Copenhagen').format('YYYY-MM-DD');

  this.select('es.id').from('event_signup as es')
    .innerJoin({e: 'event'}, 'es.event', 'e.id')
    .where({
      'es.archived': 0,
      'e.archived': 0,
      'es.user': knex.raw('u.id'),
    })
    .andWhere(function () {
      this.where('e.start_date', '>=', todayIsoDate)
        .orWhere(function () {
          this.where('e.use_time_slots', 1)
            .whereNotNull(function () {
              this.select('id').from('event_time_slot as ets')
                .where({
                  event: knex.raw('e.id'),
                  archived: 0,
                })
                .andWhere('ets.date', '>=', todayIsoDate)
                .limit(1);
            });
        });
    })
    .limit(1);
};

module.exports = {
  friendlyName: 'Customer data',

  inputs: {
    client: {
      type: 'ref',
      required: true,
    },

    onlyActiveCustomers: {
      type: 'boolean',
    },
    onlyInactiveCustomers: {
      type: 'boolean',
    },
  },

  fn: async (inputs, exits) => {

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client);


    const query = knex({u: 'user'})
      .where({
        client: clientId,
        customer: 1,
        archived: 0,
      })
      .select('u.email', 'u.first_name', 'u.last_name')
      .orderBy(['u.first_name', 'u.last_name']);

    if (inputs.onlyActiveCustomers) {
      query.where(activeCustomersQueryBuilder => activeCustomersQueryBuilder
        .whereNotNull(activeMembershipSubquery)
        .orWhereNotNull(activeClassPassSubquery)
        .orWhereNotNull(activeEventSignupSubquery),
      );
    }

    if (inputs.onlyInactiveCustomers) {
      query.where(activeCustomersQueryBuilder => activeCustomersQueryBuilder
        .whereNull(activeMembershipSubquery)
        .whereNull(activeClassPassSubquery)
        .whereNull(activeEventSignupSubquery),
      );
    }

    console.log(query.toString());

    const customers = await query;

    return exits.success(customers);

  },

};
