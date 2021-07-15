module.exports = {
  friendlyName: 'Update video group',

  inputs: {
    name: {
      type: 'string',
      required: false,
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
    },
    sort_videos_by: {
      type: 'string',
      isIn: ['created', 'name'],
      required: false,
    },
    sort_videos_direction: {
      type: 'string',
      iIn: ['asc', 'desc'],
      required: false,
    },
    show_video_descriptions: {
      type: 'boolean',
      required: false
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoGroups.update', this.req))) {
      return exits.forbidden()
    }

    const videoGroupId = this.req.param('id')

    const updateData = _.pick(inputs, [
      'name',
      'sort_videos_by',
      'sort_videos_direction',
      'show_video_descriptions',
      'public_access'
    ])

    if (inputs.name) {
      await VideoGroup.update(
        {
          id: videoGroupId,
          client: this.req.client.id,
        },
        updateData,
      )
    }

    if (inputs.membership_types) {
      let membershipTypeIds = inputs.membership_types
      const membershipTypesForWrongClient = await knex({mt: 'membership_type'})
        .where('id', 'in', membershipTypeIds)
        .andWhere('client', '!=', this.req.client.id)

      if (membershipTypesForWrongClient.length) {
        _.pullAll(membershipTypeIds, _.map(membershipTypesForWrongClient, 'id'))
      }

      await VideoGroup.replaceCollection(videoGroupId, 'membership_types').members(membershipTypeIds)
    }

    if (inputs.class_pass_types) {
      let classPassTypeIds = inputs.class_pass_types
      const classPassTypesForWrongClient = await knex({cpt: 'class_pass_type'})
        .where('id', 'in', classPassTypeIds)
        .andWhere('client', '!=', this.req.client.id)

      if (classPassTypesForWrongClient.length) {
        _.pullAll(classPassTypeIds, _.map(classPassTypesForWrongClient, 'id'))
      }

      await VideoGroup.replaceCollection(videoGroupId, 'class_pass_types').members(classPassTypeIds)
    }

    if (inputs.events) {
      let eventIds = inputs.events
      const eventsForWrongClient = await knex({e: 'event'})
        .where('id', 'in', eventIds)
        .andWhere('client', '!=', this.req.client.id)

      if (eventsForWrongClient.length) {
        _.pullAll(eventIds, _.map(eventsForWrongClient, 'id'))
      }

      await VideoGroup.replaceCollection(videoGroupId, 'events').members(eventIds)
    }

    return exits.success()

  },
}
