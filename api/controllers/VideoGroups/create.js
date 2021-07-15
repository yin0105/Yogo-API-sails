module.exports = {
  friendlyName: 'Create video group',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    sort_videos_by: {
      type: 'string',
      required: false,
      isIn: ['created', 'name'],
    },
    sort_videos_direction: {
      type: 'string',
      required: false,
      isIn: ['asc', 'desc'],
    },
    show_video_descriptions: {
      type: 'boolean',
      required: false
    },
    membership_types: {
      type: 'json',
      required: false,
    },
    class_pass_types: {
      type: 'json',
      required: false,
    },
    events: {
      type: 'json',
      required: false,
    },
    public_access: {
      type: 'boolean',
      defaultsTo: false,
    }
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoGroups.create', this.req))) {
      return exits.forbidden()
    }

    const videoGroupData = _.pick(inputs, [
      'name',
      'sort_videos_by',
      'sort_videos_direction',
      'show_video_descriptions',
      'public_access',
    ])
    videoGroupData.client = this.req.client.id

    const videoGroup = await VideoGroup.create(videoGroupData).fetch()

    if (inputs.membership_types) {
      let membershipTypeIds = inputs.membership_types
      const membershipTypesForWrongClient = await knex({mt: 'membership_type'})
        .where('id', 'in', membershipTypeIds)
        .andWhere('client', '!=', this.req.client.id)

      if (membershipTypesForWrongClient.length) {
        _.pullAll(membershipTypeIds, _.map(membershipTypesForWrongClient, 'id'))
      }

      await VideoGroup.replaceCollection(videoGroup.id, 'membership_types').members(membershipTypeIds)
    }

    if (inputs.class_pass_types) {
      let classPassTypeIds = inputs.class_pass_types
      const classPassTypesForWrongClient = await knex({cpt: 'class_pass_type'})
        .where('id', 'in', classPassTypeIds)
        .andWhere('client', '!=', this.req.client.id)

      if (classPassTypesForWrongClient.length) {
        _.pullAll(classPassTypeIds, _.map(classPassTypesForWrongClient, 'id'))
      }

      await VideoGroup.replaceCollection(videoGroup.id, 'class_pass_types').members(classPassTypeIds)
    }

    if (inputs.events) {
      let eventIds = inputs.events
      const eventsForWrongClient = await knex({e: 'event'})
        .where('id', 'in', eventIds)
        .andWhere('client', '!=', this.req.client.id)

      if (eventsForWrongClient.length) {
        _.pullAll(eventIds, _.map(eventsForWrongClient, 'id'))
      }

      await VideoGroup.replaceCollection(videoGroup.id, 'events').members(eventIds)
    }

    return exits.success()

  },
}
