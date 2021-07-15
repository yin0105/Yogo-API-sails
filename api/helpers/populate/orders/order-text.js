module.exports = {
  friendlyName: 'Get order text, typical for use with payment provider',

  inputs: {
    orders: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.orders.length) {
      return exits.success([]);
    }

    // Already populated??
    if (typeof inputs.orders[0].order_text !== 'undefined') {
      return exits.success(inputs.orders);
    }

    await Promise.all(_.map(inputs.orders, async order => {

      const user = order.user
        ? (await sails.helpers.util.objectFromObjectOrObjectId(order.user, User))
        : {
          first_name: `${order.non_user_name}, ${order.non_user_email}`,
          last_name: '',
        };

      if (typeof order.order_items === 'undefined') {
        order.order_items = await OrderItem.find({order: order.id, archived: false});
      }

      order.order_text = [user.first_name + ' ' + user.last_name];
      _.each(order.order_items, (orderItem) => {
        order.order_text.push((orderItem.count > 1 ? orderItem.count + ' x ' : '') + orderItem.name);
      });
      order.order_text = order.order_text.join('\n');

    }));

    return exits.success(inputs.orders);
  },

};
