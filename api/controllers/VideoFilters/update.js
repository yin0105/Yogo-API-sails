module.exports = {
  friendlyName: 'Update video filter',

  inputs: {
    id: {
      type: 'number'
    },
    name: {
      type: 'string',
    },
    filter_type: {
      type: 'string',
      isIn: ['custom','teachers'],
    },
    filter_values: {
      type: 'json',
    },
    show_in_more_filters: {
      type: 'boolean',
    },
    show_only_for_specific_main_categories: {
      type: 'boolean',
    },
    show_for_main_categories: {
      type: 'json',
    },
    sort_idx: {
      type: 'number'
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function(inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoFilters.update', this.req, inputs))) {
      return exits.forbidden()
    }

    const currentVideoFilter = await VideoFilter.findOne({id: inputs.id, archived: false, client_id: this.req.client.id});

    const updateData = _.pick(
      inputs,
      [
        'name',
        'filter_type',
        'show_in_more_filters',
        'show_only_for_specific_main_categories',
        'show_for_main_categories',
        'sort_idx'
      ]
    );

    if (typeof updateData.sort_idx !== 'undefined') {

      await knex({vf: 'video_filter'})
        .where({
          client_id: this.req.client.id,
        })
        .andWhere('sort_idx', '>', currentVideoFilter.sort_idx)
        .update(knex.raw("sort_idx = sort_idx - 1"));

      await knex({vf: 'video_filter'})
        .where({
          client_id: this.req.client.id,
        })
        .andWhere('sort_idx', '>=', inputs.sort_idx)
        .update(knex.raw("sort_idx = sort_idx + 1"));
    }

    const [updatedVideoFilter] = await VideoFilter.update({id: inputs.id}, updateData).fetch();

    if (currentVideoFilter.filter_type === 'teachers' && inputs.filter_type === 'custom') {
      await sails.helpers.videoFilter.createValues(inputs.filter_values, updatedVideoFilter);
    } else if (currentVideoFilter.filter_type === 'custom' && inputs.filter_type === 'teachers') {
      await sails.helpers.videoFilter.destroyValues(updatedVideoFilter);
    } else if (currentVideoFilter.filter_type === 'custom' && inputs.filter_type === 'custom') {
      await sails.helpers.videoFilter.updateValues(inputs.filter_values, updatedVideoFilter);
    }

    return exits.success(updatedVideoFilter);

  }

}
