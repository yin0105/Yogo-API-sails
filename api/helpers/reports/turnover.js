const knex = require('../../services/knex');
const moment = require('moment-timezone');


const getDirectSaleTurnoverForPeriod = async (client, startDate, endDate) => {

  // Discount codes are separate order items. Therefore it is recorded how much discount is applied to each of the other order items.
  const query = knex({oi: 'order_item'})
    .select(
      'oi.item_type',
      knex.raw("GROUP_CONCAT(DISTINCT IF(oi.item_type = 'membership_type', mt.name, oi.name)) AS name"),
      'oi.item_id',
      knex.raw('ROUND( SUM(oi.total_price - oi.applied_discount_code_amount), 2) AS turnover'),
      knex.raw("ROUND( SUM(IF(oi.item_type = 'product', (oi.total_price - oi.applied_discount_code_amount) * 0.2, 0)), 2) AS vat_amount"),
      knex.raw("SUM(oi.`count`) AS item_count"),
      knex.raw(`
      IF(
        oi.item_type = 'event',
        DATE_FORMAT(
          IFNULL(
            (SELECT date FROM event_time_slot WHERE \`event\` = oi.item_id AND archived = 0 ORDER BY date ASC, start_time ASC LIMIT 1),
            (SELECT start_date FROM \`event\` WHERE id = oi.item_id)
          ),
          '%Y-%m-%d'
        ),
        NULL
      ) AS event_start_date
      `),
    )
    .innerJoin({o: 'order'}, 'oi.order', 'o.id')
    .leftJoin({mt: 'membership_type'}, 'oi.item_id', 'mt.id')
    .where(
      'oi.client', '=', client,
    )
    .andWhere(
      'o.invoice_id', '>', 0,
    )
    .andWhere(
      'o.paid', '>=', moment.tz(startDate, 'Europe/Copenhagen').format('x'),
    )
    .andWhere(
      'o.paid', '<', moment.tz(endDate, 'Europe/Copenhagen').add(1, 'day').format('x'),
    )
    .andWhere(
      'oi.item_type', 'IN', ['product', 'membership_type', 'event', 'class_pass_type', 'membership_no_show_fee', 'gift_card_purchase', 'gift_card_spend', 'membership_pause_fee'],
    )
    .groupBy(['oi.item_type', 'oi.item_id'])
    .orderBy(['oi.item_type', 'event_start_date', 'name']);

  const directSaleTurnover = await query;

  // Cull empty event start dates
  return _.map(
    directSaleTurnover,
    turnoverItem => {
      if (!turnoverItem.event_start_date) {
        delete turnoverItem.event_start_date;
      }
      return turnoverItem;
    },
  );

};


const getMembershipRenewalTurnoverForPeriod = async (client, startDate, endDate) => {

  // For membership renewals, discount codes are applied directly to the amount. So discount should not be deducted again for the report.
  return await knex({oi: 'order_item'})
    .innerJoin({o: 'order'}, 'oi.order', 'o.id')
    .innerJoin({mt: 'membership_type'}, 'oi.membership_renewal_membership_type', 'mt.id')
    .select(
      'mt.id AS item_id',
      'oi.item_type',
      'mt.name',
      knex.raw("ROUND( SUM(oi.total_price), 2) AS turnover"),
      knex.raw("0 AS vat_amount"),
      knex.raw("SUM(oi.`count`) as item_count"),
    )
    //.sum('oi.total_price as turnover')
    .where(
      'oi.client', '=', client,
    )
    .andWhere(
      'o.invoice_id', '>', 0,
    )
    .andWhere(
      'o.paid', '>=', moment.tz(startDate, 'Europe/Copenhagen').format('x'),
    )
    .andWhere(
      'o.paid', '<', moment.tz(endDate, 'Europe/Copenhagen').add(1, 'day').format('x'),
    )
    .andWhere(
      'oi.item_type', '=', 'membership_renewal',
    )
    .groupBy('mt.id')
    .orderBy('mt.name');
};

const summarizeMembershipData = async turnoverRows => {

  // Combine membership payment types to one amount per membership type
  const membershipSumRows = _.chain(turnoverRows)
    .filter(row => row.item_type === 'membership_type' || row.item_type === 'membership_renewal')
    .groupBy('item_id')
    .map((membershipRows, itemId) => {
      return _.reduce(
        membershipRows,
        (sum, membershipRow) => {
          sum.turnover += membershipRow.turnover;
          sum.item_count += membershipRow.item_count;
          return sum;
        },
        {
          item_id: itemId,
          name: membershipRows[0].name,
          turnover: 0,
          item_count: 0,
          item_type: 'membership',
          vat_amount: 0,
        },
      );
    })
    .toArray()
    .value();

  turnoverRows = turnoverRows.concat(membershipSumRows);
  turnoverRows = _.filter(turnoverRows, row => row.item_type !== 'membership_type' && row.item_type !== 'membership_renewal');

  return turnoverRows;
};

const addDatesToEventNames = async turnoverRows => {

  const eventIds = _.chain(turnoverRows)
    .filter(row => row.item_type === 'event')
    .map('item_id')
    .value();

  const eventsPopulatedWithTimeSlots = await Event.find({id: eventIds}).populate('time_slots');

  const keyedEventsWithTimeSlots = _.keyBy(eventsPopulatedWithTimeSlots, 'id');

  turnoverRows = _.map(
    turnoverRows,
    row => {
      if (row.item_type !== 'event') {
        return row;
      }
      const event = keyedEventsWithTimeSlots[row.item_id];
      if (event.use_time_slots) {
        if (!event.time_slots || !event.time_slots.length) return row;

        const timeSlots = _.sortBy(event.time_slots, ['date', 'start_time']);
        let dateString = moment(timeSlots[0].date).format('DD.MM.YYYY');
        row.name = '[' + dateString + '] ' + row.name;
        return row;
      } else {
        row.name = '[' + moment(event.start_date).format('DD.MM.YYYY') + '] ' + row.name;
        return row;
      }
    },
  );

  return turnoverRows;
};

const summarizeNoShowFeeRows = async (turnoverRows) => {
  const noShowFeeSummarizedRows = _.chain(turnoverRows)
    .filter({item_type: 'membership_no_show_fee'})
    .groupBy('name')
    .map((noShowFeeRows, rowName) => {
      return _.reduce(
        noShowFeeRows,
        (sum, membershipRow) => {
          sum.turnover += membershipRow.turnover;
          sum.item_count += membershipRow.item_count;
          return sum;
        },
        {
          item_id: null,
          name: rowName,
          turnover: 0,
          item_count: 0,
          item_type: 'membership_no_show_fee',
          vat_amount: 0,
        },
      );
    })
    .toArray()
    .value();

  if (noShowFeeSummarizedRows.length) {
    turnoverRows = _.filter(turnoverRows, row => row.item_type !== 'membership_no_show_fee');
    turnoverRows = turnoverRows.concat(noShowFeeSummarizedRows);
  }

  return turnoverRows;

};

const summarizeGiftCards = (turnoverRows) => {

  const giftCardPurchaseRows = _.filter(turnoverRows, {item_type: 'gift_card_purchase'});

  if (giftCardPurchaseRows.length) {
    const giftCardPurchaseSum = _.chain(giftCardPurchaseRows)
      .map('turnover')
      .reduce((sum, turnover) => {
        return sum + turnover;
      }, 0)
      .value();

    turnoverRows = _.filter(
      turnoverRows,
      row => row.item_type !== 'gift_card_purchase',
    );
    turnoverRows.push({
      item_id: null,
      name: '',
      turnover: giftCardPurchaseSum,
      item_count: giftCardPurchaseRows.length,
      item_type: 'gift_card_purchase',
      vat_amount: 0,
    });
  }

  const giftCardSpendRows = _.filter(turnoverRows, {item_type: 'gift_card_spend'});

  if (giftCardSpendRows.length) {
    const giftCardSpendSum = _.chain(giftCardSpendRows)
      .map('turnover')
      .reduce((sum, turnover) => {
        return sum + turnover;
      }, 0)
      .value();
    turnoverRows = _.filter(
      turnoverRows,
      row => row.item_type !== 'gift_card_spend',
    );
    turnoverRows.push({
      item_id: null,
      name: '',
      turnover: giftCardSpendSum,
      item_count: giftCardSpendRows.length,
      item_type: 'gift_card_spend',
      vat_amount: 0,
    });
  }

  return turnoverRows;
};


const getTurnoverForPeriod = async (client, startDate, endDate) => {

  const directSalesTurnover = await getDirectSaleTurnoverForPeriod(client, startDate, endDate);

  const membershipRenewalTurnover = await getMembershipRenewalTurnoverForPeriod(client, startDate, endDate);

  let turnoverRows = [].concat(
    directSalesTurnover,
    membershipRenewalTurnover,
  );

  turnoverRows = await summarizeMembershipData(turnoverRows);

  turnoverRows = await addDatesToEventNames(turnoverRows);

  turnoverRows = await summarizeNoShowFeeRows(turnoverRows);

  turnoverRows = await summarizeGiftCards(turnoverRows);

  return turnoverRows;

};

module.exports = {

  friendlyName: 'Turnover',

  description: 'Generates the turnover report',

  inputs: {
    clientId: {
      type: 'number',
      required: true,
    },

    periodType: {
      type: 'string',
      required: true,
    },

    startDate: {
      type: 'string',
      required: false,
    },

    endDate: {
      type: 'string',
      required: false,
    },

  },

  fn: async (inputs, exits) => {

    const date = moment(inputs.startDate, 'YYYY-MM-DD');
    if (!date) throw new Error('Turnover report: date is invalid.');

    let turnoverData = [];
    switch (inputs.periodType) {
      case 'year':
        if (date.month() !== 0 || date.date() !== 1) throw new Error('Turnover report: date is not the beginning of a year');

        const year = date.year();

        const yearData = await getTurnoverForPeriod(
          inputs.clientId,
          year + '-01-01',
          year + '-12-31',
        );

        turnoverData = {
          label: year.toString(),
          startDate: year + '-01-01',
          endDate: year + '-12-31',
          items: yearData,
        };

        return exits.success(turnoverData);

      case 'month' :
        if (date.date() !== 1) throw new Error('Turnover report: date is not the beginning of a month');

        const monthData = await getTurnoverForPeriod(
          inputs.clientId,
          date.format('YYYY-MM-DD'),
          moment(date).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
        );

        turnoverData = {
          label: _.upperFirst(date.format('MMMM YYYY')),
          startDate: date.format('YYYY-MM-DD'),
          endDate: moment(date).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
          items: monthData,
        };
        return exits.success(turnoverData);

      case 'day':

        const dayData = await getTurnoverForPeriod(
          inputs.clientId,
          date.format('YYYY-MM-DD'),
          date.format('YYYY-MM-DD'),
        );

        turnoverData = {
          label: date.format('DD.MM.YYYY'),
          startDate: date.format('YYYY-MM-DD'),
          endDate: date.format('YYYY-MM-DD'),
          items: dayData,
        };

        return exits.success(turnoverData);

      case 'custom':
        const endDate = moment(inputs.endDate, 'YYYY-MM-DD');
        if (!endDate) throw new Error('Turnover report: endDate missing or invalid.');
        if (endDate.isBefore(date, 'day')) throw new Error('Turnover report: endDate can not be earlier than startDate.');
        if (endDate.diff(date, 'year') > 1) throw new Error('Turnover report: custom date interval can not exceed one year.');

        turnoverData = await getTurnoverForPeriod(
          inputs.clientId,
          date.format('YYYY-MM-DD'),
          endDate.format('YYYY-MM-DD'),
        );

        return exits.success(
          {
            label: date.format('DD.MM.YYYY') + ' - ' + endDate.format('DD.MM.YYYY'),
            startDate: date.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            items: turnoverData,
          },
        );

      default:
        throw new Error('Turnover report: Invalid period type');
    }

  },
};
