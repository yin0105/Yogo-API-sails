/**
 * VideoGroup.js
 */

module.exports = {

  tableName: 'video_group',

  attributes: {

    client: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    videos: {
      collection: 'Video',
      via: 'video_groups'
    },

    membership_types: {
      collection: 'MembershipType',
      via: 'video_groups',
    },

    class_pass_types: {
      collection: 'ClassPassType',
      via: 'video_groups',
    },

    events: {
      collection: 'Event',
      via: 'video_groups',
    },

    sort_videos_by: {
      type: 'string',
      isIn: ['created', 'name' ]
    },

    sort_videos_direction: {
      type: 'string',
      isIn: ['asc', 'desc']
    },

    show_video_descriptions: {
      type: 'boolean',
      defaultsTo: false
    },

    public_access: {
      type: 'boolean',
      defaultsTo: false,
    }

  },

}

