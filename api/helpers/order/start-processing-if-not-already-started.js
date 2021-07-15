const OrderObj = require('../../objection-models/Order');

module.exports = {
  friendlyName: 'Start processing order if processing is not already started',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
    state: {
      type: 'string',
      isIn: ['paid', 'failed'],
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log;

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order);

    let updateData;
    if (inputs.state === 'paid') {
      updateData = {
        paid: Date.now(),
      };
    }
    if (inputs.state === 'failed') {
      updateData = {
        payment_failed: Date.now(),
      };
    }

    const updateCount = await OrderObj.query()
      .where({
        id: orderId,
        paid: 0,
        payment_failed: 0,
      })
      .update(updateData);

    const doProcessOrder = !!updateCount;

    await cronLog(`doProcessOrder ID ${orderId}: ${JSON.stringify(doProcessOrder)}`);

    return exits.success(doProcessOrder);
  },

};
