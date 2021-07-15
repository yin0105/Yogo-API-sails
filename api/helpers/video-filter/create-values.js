module.exports = {
  friendlyName: 'Create values for video filter',

  inputs: {
    filterValues: {
      type: 'json',
      required: true
    },
    videoFilter: {
      type: 'ref',
      required: true
    },
  },

  fn: async (inputs, exits) => {

    const videoFilter = await sails.helpers.util.objectFromObjectOrObjectId(inputs.videoFilter, VideoFilter);

    await VideoFilterValue.createEach(_.map(inputs.filterValues, (v, idx) => ({
      client_id: videoFilter.client_id,
      name: v.name,
      video_filter_id: videoFilter.id,
      sort_idx: idx,
    })));

    return exits.success();
  }
}
