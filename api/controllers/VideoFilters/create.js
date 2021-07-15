module.exports = {
  friendlyName: 'Create video filter',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    filter_type: {
      type: 'string',
      isIn: ['custom', 'teachers'],
      required: true,
    },
    filter_values: {
      type: 'json',
      custom: json => _.every(json, value => !!value.name),
    },
    show_in_more_filters: {
      type: 'boolean',
      required: true,
    },
    show_only_for_specific_main_categories: {
      type: 'boolean',
      defaultsTo: false,
    },
    show_for_main_categories: {
      type: 'json'
    },
    sort_idx: {
      type: 'number',
      required: false,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoFilters.create', this.req))) {
      return exits.forbidden();
    }

    const insertData = _.pick(
      inputs,
      [
        'name',
        'filter_type',
        'show_in_more_filters',
        'show_only_for_specific_main_categories',
        'show_for_main_categories',
        'sort_idx',
      ],
    );

    insertData.client_id = this.req.client.id;

    if (typeof inputs.sort_idx !== 'undefined') {
      await knex({vf: 'video_filter'})
        .where({
          client_id: this.req.client.id,
        })
        .andWhere('sort_idx', '>=', inputs.sort_idx)
        .update(knex.raw("sort_idx = sort_idx + 1"));
    } else {
      const currentMaxSortIdx = (await knex('video_filter').max('sort_idx')
        .where({
          client_id: this.req.client.id,
          archived: 0,
        })
        .first())['max(\`sort_idx\`)'];
      insertData.sort_idx = currentMaxSortIdx + 1;

    }

    const createdVideoFilter = await VideoFilter.create(insertData).fetch();

    if (insertData.filter_type === 'custom') {
      await sails.helpers.videoFilter.createValues(inputs.filter_values, createdVideoFilter);
    }

    return exits.success(createdVideoFilter);

  },

};
