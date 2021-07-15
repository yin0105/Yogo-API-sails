module.exports = {
  friendlyName: 'Delete all values for video filter',

  inputs: {
    videoFilter: {
      type: 'ref',
      required: true
    },
  },

  fn: async (inputs, exits) => {

    const videoFilterId = sails.helpers.util.idOrObjectIdInteger(inputs.videoFilter);

    await VideoFilterValue.destroy({video_filter_id: videoFilterId});

    return exits.success();
  }
}
