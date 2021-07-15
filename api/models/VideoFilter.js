/**
 * VideoFilter.js
 */

module.exports = {

  tableName: 'video_filter',

  attributes: {

    client_id: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    filter_type: {
      type: 'string',
      isIn: ['custom', 'teachers'],
      defaultsTo: 'custom',
    },

    sort_idx: {
      type: 'number',
    },

    show_in_more_filters: {
      type: 'boolean',
      defaultsTo: false,
    },

    show_only_for_specific_main_categories: {
      type: 'boolean',
      defaultsTo: false,
    },

    show_for_main_categories: {
      collection: 'VideoMainCategory',
      via: 'video_filter_id',
      through: 'VideoFilterVideoMainCategory'
    },

  },

};

