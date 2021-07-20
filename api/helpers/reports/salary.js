const knex = require('../../services/knex');
const moment = require('moment-timezone');


const getDirectSaleSalaryForPeriod = async (client, fromDate, endDate) => {

  // Discount codes are separate order items. Therefore it is recorded how much discount is applied to each of the other order items.
  const query = knex({oi: 'order_item'})
    .select(
      'oi.item_type',
      knex.raw("GROUP_CONCAT(DISTINCT IF(oi.item_type = 'membership_type', mt.name, oi.name)) AS name"),
      'oi.item_id',
      knex.raw('ROUND( SUM(oi.total_price - oi.applied_discount_code_amount), 2) AS salary'),
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
      'o.paid', '>=', moment.tz(fromDate, 'Europe/Copenhagen').format('x'),
    )
    .andWhere(
      'o.paid', '<', moment.tz(endDate, 'Europe/Copenhagen').add(1, 'day').format('x'),
    )
    .andWhere(
      'oi.item_type', 'IN', ['product', 'membership_type', 'event', 'class_pass_type', 'membership_no_show_fee', 'gift_card_purchase', 'gift_card_spend', 'membership_pause_fee'],
    )
    .groupBy(['oi.item_type', 'oi.item_id'])
    .orderBy(['oi.item_type', 'event_start_date', 'name']);

  const directSaleSalary = await query;

  // Cull empty event start dates
  return _.map(
    directSaleSalary,
    salaryItem => {
      if (!salaryItem.event_start_date) {
        delete salaryItem.event_start_date;
      }
      return salaryItem;
    },
  );

};


const getMembershipRenewalSalaryForPeriod = async (client, fromDate, endDate) => {

  // For membership renewals, discount codes are applied directly to the amount. So discount should not be deducted again for the report.
  return await knex({oi: 'order_item'})
    .innerJoin({o: 'order'}, 'oi.order', 'o.id')
    .innerJoin({mt: 'membership_type'}, 'oi.membership_renewal_membership_type', 'mt.id')
    .select(
      'mt.id AS item_id',
      'oi.item_type',
      'mt.name',
      knex.raw("ROUND( SUM(oi.total_price), 2) AS salary"),
      knex.raw("0 AS vat_amount"),
      knex.raw("SUM(oi.`count`) as item_count"),
    )
    //.sum('oi.total_price as salary')
    .where(
      'oi.client', '=', client,
    )
    .andWhere(
      'o.invoice_id', '>', 0,
    )
    .andWhere(
      'o.paid', '>=', moment.tz(fromDate, 'Europe/Copenhagen').format('x'),
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

const summarizeMembershipData = async salaryRows => {

  // Combine membership payment types to one amount per membership type
  const membershipSumRows = _.chain(salaryRows)
    .filter(row => row.item_type === 'membership_type' || row.item_type === 'membership_renewal')
    .groupBy('item_id')
    .map((membershipRows, itemId) => {
      return _.reduce(
        membershipRows,
        (sum, membershipRow) => {
          sum.salary += membershipRow.salary;
          sum.item_count += membershipRow.item_count;
          return sum;
        },
        {
          item_id: itemId,
          name: membershipRows[0].name,
          salary: 0,
          item_count: 0,
          item_type: 'membership',
          vat_amount: 0,
        },
      );
    })
    .toArray()
    .value();

  salaryRows = salaryRows.concat(membershipSumRows);
  salaryRows = _.filter(salaryRows, row => row.item_type !== 'membership_type' && row.item_type !== 'membership_renewal');

  return salaryRows;
};

const addDatesToEventNames = async salaryRows => {

  const eventIds = _.chain(salaryRows)
    .filter(row => row.item_type === 'event')
    .map('item_id')
    .value();

  const eventsPopulatedWithTimeSlots = await Event.find({id: eventIds}).populate('time_slots');

  const keyedEventsWithTimeSlots = _.keyBy(eventsPopulatedWithTimeSlots, 'id');

  salaryRows = _.map(
    salaryRows,
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

  return salaryRows;
};

const summarizeNoShowFeeRows = async (salaryRows) => {
  const noShowFeeSummarizedRows = _.chain(salaryRows)
    .filter({item_type: 'membership_no_show_fee'})
    .groupBy('name')
    .map((noShowFeeRows, rowName) => {
      return _.reduce(
        noShowFeeRows,
        (sum, membershipRow) => {
          sum.salary += membershipRow.salary;
          sum.item_count += membershipRow.item_count;
          return sum;
        },
        {
          item_id: null,
          name: rowName,
          salary: 0,
          item_count: 0,
          item_type: 'membership_no_show_fee',
          vat_amount: 0,
        },
      );
    })
    .toArray()
    .value();

  if (noShowFeeSummarizedRows.length) {
    salaryRows = _.filter(salaryRows, row => row.item_type !== 'membership_no_show_fee');
    salaryRows = salaryRows.concat(noShowFeeSummarizedRows);
  }

  return salaryRows;

};

const summarizeGiftCards = (salaryRows) => {

  const giftCardPurchaseRows = _.filter(salaryRows, {item_type: 'gift_card_purchase'});

  if (giftCardPurchaseRows.length) {
    const giftCardPurchaseSum = _.chain(giftCardPurchaseRows)
      .map('salary')
      .reduce((sum, salary) => {
        return sum + salary;
      }, 0)
      .value();

    salaryRows = _.filter(
      salaryRows,
      row => row.item_type !== 'gift_card_purchase',
    );
    salaryRows.push({
      item_id: null,
      name: '',
      salary: giftCardPurchaseSum,
      item_count: giftCardPurchaseRows.length,
      item_type: 'gift_card_purchase',
      vat_amount: 0,
    });
  }

  const giftCardSpendRows = _.filter(salaryRows, {item_type: 'gift_card_spend'});

  if (giftCardSpendRows.length) {
    const giftCardSpendSum = _.chain(giftCardSpendRows)
      .map('salary')
      .reduce((sum, salary) => {
        return sum + salary;
      }, 0)
      .value();
    salaryRows = _.filter(
      salaryRows,
      row => row.item_type !== 'gift_card_spend',
    );
    salaryRows.push({
      item_id: null,
      name: '',
      salary: giftCardSpendSum,
      item_count: giftCardSpendRows.length,
      item_type: 'gift_card_spend',
      vat_amount: 0,
    });
  }

  return salaryRows;
};


const getSalaryForPeriod = async (client, fromDate, endDate) => {

  const directSalesSalary = await getDirectSaleSalaryForPeriod(client, fromDate, endDate);

  const membershipRenewalSalary = await getMembershipRenewalSalaryForPeriod(client, fromDate, endDate);

  let salaryRows = [].concat(
    directSalesSalary,
    membershipRenewalSalary,
  );

  salaryRows = await summarizeMembershipData(salaryRows);

  salaryRows = await addDatesToEventNames(salaryRows);

  salaryRows = await summarizeNoShowFeeRows(salaryRows);

  salaryRows = await summarizeGiftCards(salaryRows);

  return salaryRows;

};

module.exports = {

  friendlyName: 'Salary',

  description: 'Generates the salary report',

  inputs: {
    clientId: {
      type: 'number',
      required: true,
    },

    teachers: {
      type: 'ref',
      required: true,
    },

    fromDate: {
      type: 'string',
      required: false,
    },

    endDate: {
      type: 'string',
      required: false,
    },

  },

  fn: async (inputs, exits) => {

    const date = moment(inputs.fromDate, 'YYYY-MM-DD');
    if (!date) throw new Error('Salary report: date is invalid.');

    let salaryData = [];
    // switch (inputs.periodType) {
    //   case 'year':
    //     if (date.month() !== 0 || date.date() !== 1) throw new Error('Salary report: date is not the beginning of a year');

    //     const year = date.year();

    //     const yearData = await getSalaryForPeriod(
    //       inputs.clientId,
    //       year + '-01-01',
    //       year + '-12-31',
    //     );

    //     salaryData = {
    //       label: year.toString(),
    //       fromDate: year + '-01-01',
    //       endDate: year + '-12-31',
    //       items: yearData,
    //     };

    //     return exits.success(salaryData);

    //   case 'month' :
    //     if (date.date() !== 1) throw new Error('Salary report: date is not the beginning of a month');

    //     const monthData = await getSalaryForPeriod(
    //       inputs.clientId,
    //       date.format('YYYY-MM-DD'),
    //       moment(date).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
    //     );

    //     salaryData = {
    //       label: _.upperFirst(date.format('MMMM YYYY')),
    //       fromDate: date.format('YYYY-MM-DD'),
    //       endDate: moment(date).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
    //       items: monthData,
    //     };
    //     return exits.success(salaryData);

    //   case 'day':

      const dayData = await getSalaryForPeriod(
        inputs.clientId,
        date.format('YYYY-MM-DD'),
        date.format('YYYY-MM-DD'),
      );

      salaryData = {
        label: date.format('DD.MM.YYYY'),
        fromDate: date.format('YYYY-MM-DD'),
        endDate: date.format('YYYY-MM-DD'),
        items: dayData,
      };

      return exits.success(salaryData);

    //   case 'custom':
    //     const endDate = moment(inputs.endDate, 'YYYY-MM-DD');
    //     if (!endDate) throw new Error('Salary report: endDate missing or invalid.');
    //     if (endDate.isBefore(date, 'day')) throw new Error('Salary report: endDate can not be earlier than fromDate.');
    //     if (endDate.diff(date, 'year') > 1) throw new Error('Salary report: custom date interval can not exceed one year.');

    //     salaryData = await getSalaryForPeriod(
    //       inputs.clientId,
    //       date.format('YYYY-MM-DD'),
    //       endDate.format('YYYY-MM-DD'),
    //     );

    //     return exits.success(
    //       {
    //         label: date.format('DD.MM.YYYY') + ' - ' + endDate.format('DD.MM.YYYY'),
    //         fromDate: date.format('YYYY-MM-DD'),
    //         endDate: endDate.format('YYYY-MM-DD'),
    //         items: salaryData,
    //       },
    //     );

    //   default:
    //     throw new Error('Salary report: Invalid period type');
    // }

  },
};
