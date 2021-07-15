module.exports = {
  friendlyName: 'Update values for video filter',

  inputs: {
    filterValues: {
      type: 'json',
      required: true,
    },
    videoFilter: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const videoFilter = await sails.helpers.util.objectFromObjectOrObjectId(inputs.videoFilter, VideoFilter);

    const existingValues = await VideoFilterValue.find({video_filter_id: videoFilter.id});

    const deletedValues = _.differenceBy(existingValues, inputs.filterValues, 'id');
    await VideoFilterValue.destroy({id: _.map(deletedValues, 'id')});

    const valuesForInsertion = [];
    for (let i = 0; i < inputs.filterValues.length; i++) {
      if (inputs.filterValues[i].id) {
        await VideoFilterValue.update({
          id: inputs.filterValues[i].id,
        }, {
          name: inputs.filterValues[i].name,
          sort_idx: i,
        });
      } else {
        valuesForInsertion.push({
          client_id: videoFilter.client_id,
          name: inputs.filterValues[i].name,
          sort_idx: i,
          video_filter_id: videoFilter.id
        });
      }
    }
    if (valuesForInsertion.length) {
      await VideoFilterValue.createEach(valuesForInsertion);
    }

    return exits.success();
  },
};
