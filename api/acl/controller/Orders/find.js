module.exports = {
  admin: async (req) => {
    let ids = req.param('id') || req.query.id;

    if (ids) {
      ids = _.isArray(ids) ? ids : [ids];

      const invalidOrders = await knex({o: 'order'})
        .where('id', 'in', ids)
        .andWhere('client', '!=', req.client.id);

      return !invalidOrders.length;

    }

    return true;
  },

  customer: async (req) => {

    let ids = req.param('id') || req.query.id;

    if (ids) {
      ids = _.isArray(ids) ? ids : [ids];

      const invalidOrders = await knex({o: 'order'})
        .where('id', 'in', ids)
        .andWhere('user', '!=', req.user.id);

      return !invalidOrders.length;

    }

    return false;

  },
};
