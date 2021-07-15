module.exports = {
  friendlyName: 'Populate video count',

  inputs: {
    videoGroups: {
      type: 'ref',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.videoGroups.length) {
      return exits.success([])
    }

    if (typeof inputs.videoGroups[0].video_count !== 'undefined') {
      return exits.success()
    }

    if (typeof inputs.videoGroups[0].videos !== 'undefined') {
      _.each(inputs.videoGroups, videoGroup => {
        videoGroup.video_count = videoGroup.videos.length
      })

      return exits.success()
    }

    const videoGroupIds = _.map(inputs.videoGroups, 'id')

    const videoCountsQuery = knex({vg: 'video_group'})
      .select('vg.id AS id')
      .count('v.id AS videoCount')
      .innerJoin({joinTbl: 'video_video_groups__videogroup_videos'}, 'joinTbl.videogroup_videos', 'vg.id')
      .innerJoin({v: 'video'}, 'joinTbl.video_video_groups', 'v.id')
      .groupBy('vg.id')
      .where('vg.id', 'in', videoGroupIds)
      .andWhere('v.archived', 0)

    const videoCounts = await videoCountsQuery

    _.each(inputs.videoGroups, videoGroup => {
      const row = _.find(videoCounts, {id: videoGroup.id})
      videoGroup.video_count = row ? row.videoCount : 0
    })

    return exits.success()
  },
}
