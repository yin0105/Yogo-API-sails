const EAGER_POPULATE_FIELDS = [
  'membership_types',
  'events',
  'class_pass_types',
  'videos',
]

const MANUAL_POPULATE_FIELDS = [
  'video_count',
]

module.exports = {
  friendlyName: 'Find video groups',

  inputs: {
    id: {
      type: 'json',
      required: false,
      description: 'Id or array of ids. Id can also be specified using the shorthand /video-groups/:id',
    },
    populate: {
      type: 'json',
      required: false,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoGroups.find', this.req))) {
      return exits.forbidden()
    }

    const queryParameters = {
      client: this.req.client.id,
      archived: false,
    }

    const ids = this.req.param('id') ? this.req.param('id') : inputs.id
    if (ids) {
      queryParameters.id = ids
    }

    const videoGroupsQuery = VideoGroup.find(queryParameters).sort('name')
    const populateFields = inputs.populate ? _.intersection(inputs.populate, EAGER_POPULATE_FIELDS) : []
    _.each(populateFields, field => {
      videoGroupsQuery.populate(field, {archived: false})
    })

    const videoGroups = await videoGroupsQuery

    if (videoGroups[0] && typeof videoGroups[0].videos !== 'undefined') {
      await sails.helpers.populate.videos.videoProviderData(
        _.chain(videoGroups).map('videos').flatten().value()
      )
    }

    const manualPopulateFields = inputs.populate ? _.intersection(inputs.populate, MANUAL_POPULATE_FIELDS) : []

    // Don't use Promise.all, since fields might depend on each other
    for (let i = 0; i < manualPopulateFields.length; i++) {
      const manualPopulateField = manualPopulateFields[i]
      await sails.helpers.populate.videoGroups[_.camelCase(manualPopulateField)](videoGroups)
    }

    if (videoGroups.length && typeof videoGroups[0].videos !== 'undefined') {
      const allVideos = _.chain(videoGroups).map('videos').flatten().value()
      await sails.helpers.video.setInformationLevelForUser(allVideos, this.req)
    }

    return exits.success(
      this.req.param('id') ?
        (videoGroups[0] ? videoGroups[0] : 'E_VIDEO_GROUP_DOES_NOT_EXIST') :
        videoGroups
    )

  },

}
