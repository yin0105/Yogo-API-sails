module.exports = {
  friendlyName: 'Update video filters sort order',

  inputs: {
    sortOrder: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoFilters.update-sort', this.req))) {
      return exits.forbidden();
    }

    const videoFilterIds = inputs.sortOrder;

    await Promise.all(
      _.map(
        videoFilterIds,
        (id, idx) => VideoFilter.update(
          {
            id: id,
            client_id: this.req.client.id,
            archived: false,
          },
          {
            sort_idx: idx,
          },
        ),
      ),
    );

    return exits.success();
  },
};
