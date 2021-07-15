module.exports = {
  friendlyName: 'Find main categories',

  fn: async function (inputs, exits) {

    const mainCategories = await VideoMainCategory.find({
      client_id: this.req.client.id,
      archived: false,
    }).sort('sort_idx');

    return exits.success(mainCategories);

  },
};
