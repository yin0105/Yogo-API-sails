const UserObjection = require('../../objection-models/User');

module.exports = {
  friendlyName: 'User (customer) history',

  description: 'Returns all relevant customer data on a user',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Users.history', this.req, inputs)) {
      return exits.forbidden();
    }

    const user = await UserObjection
      .query()
      .findById(inputs.id)
      .eager(
        {
          image: true,
          class_signups: {
            class: {
              class_type: true,
              teachers: true,
              room: {
                branch: true,
              },
            },
            used_class_pass: {
              class_pass_type: true,
            },
            used_membership: {
              membership_type: true,
            },
          },
          class_livestream_signups: {
            class: {
              class_type: true,
              teachers: true,
              room: {
                branch: true,
              },
            },
            used_class_pass: {
              class_pass_type: true,
            },
            used_membership: {
              membership_type: true,
            },
          },
          event_signups: {
            event: {
              teachers: true,
              event_group: true,
              room: {
                branch: true,
              },
            },
          },
          class_passes: {
            class_pass_type: true,
          },
          memberships: {
            membership_type: true,
          },
          orders: true,
        },
      )
      .modifyEager('orders', builder => {
        builder.where('invoice_id', '>', 0);
      });

    user.class_signups = _.reverse(_.sortBy(user.class_signups, cs => cs.class.date + cs.class.start_time));

    user.class_livestream_signups = _.reverse(_.sortBy(user.class_livestream_signups, cls => cls.class.date + cls.class.start_time));

    user.event_signups = _.reverse(_.sortBy(user.event_signups, es => es.event.start_date));

    user.class_passes = _.reverse(_.sortBy(user.class_passes, 'start_date'));

    user.memberships = _.reverse(_.sortBy(user.memberships, 'start_date'));

    await sails.helpers.populate.orders.receiptLink(user.orders);
    await sails.helpers.populate.memberships.statusText(user.memberships, this.req.i18n);

    user.orders = _.reverse(user.orders);

    return exits.success(user);

  },
};
