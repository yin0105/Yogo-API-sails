const MembershipObj = require('../../objection-models/Membership');
const ClassPassObj = require('../../objection-models/ClassPass');
//const VideoGroupObj = require('../../objection-models/VideoGroup');
//const VideoObj = require('../../objection-models/Video');

const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Check if user has access to video',

  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
    video: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);

    const videoId = sails.helpers.util.idOrObjectIdInteger(inputs.video);

    /*const videoIsInFreeVideoGroups = await VideoObj.query().alias('v')
      .joinRelation('video_groups', {alias: 'vg'})
      .where({
        'v.id': videoId,
        'vg.archived': 0,
        'vg.public_access': 1,
      });


    if (videoIsInFreeVideoGroups.length) {
      console.log(videoIsInFreeVideoGroups);
      console.log('Video is in free video groups ' + videoIsInFreeVideoGroups[0].name);
      return exits.success(true);
    }*/

    const validMembershipsWithAllAccess = await MembershipObj.query().alias('m')
      .joinRelation('membership_type', {alias: 'mt'})
      .where({
        'm.user': userId,
        'm.archived': 0,
        'mt.access_all_videos': 1,
      })
      .andWhere('m.status', 'in', ['active', 'cancelled_running']);

    if (validMembershipsWithAllAccess.length) {
      return exits.success(true);
    }

    const validClassPassesWithAllAccess = await ClassPassObj.query().alias('cp')
      .joinRelation('class_pass_type', {alias: 'cpt'})
      .where({
        'cp.user': userId,
        'cp.archived': 0,
        'cpt.access_all_videos': 1,
      })
      .andWhere('cp.valid_until', '>=', moment.tz('Europe/Copenhagen').format('YYYY-MM-DD'));

    if (validClassPassesWithAllAccess.length) {
      return exits.success(true);
    }

    const validMemberships = await knex({m: 'membership'})
      .innerJoin({mt: 'membership_type'}, 'm.membership_type', 'mt.id')
      .innerJoin({joinTbl: 'membershiptype_video_groups__videogroup_membership_types'}, 'mt.id', 'joinTbl.membershiptype_video_groups')
      .innerJoin({vg: 'video_group'}, 'vg.id', 'joinTbl.videogroup_membership_types')
      .innerJoin({videoJoinTbl: 'video_video_groups__videogroup_videos'}, 'videoJoinTbl.videogroup_videos', 'vg.id')
      .where('m.user', userId)
      .andWhere('m.archived', 0)
      .andWhere('m.status', 'in', ['active', 'cancelled_running'])
      .andWhere('vg.archived', 0)
      .andWhere('videoJoinTbl.video_video_groups', videoId);

    if (validMemberships.length) {
      return exits.success(true);
    }

    const validClassPasses = await knex({cp: 'class_pass'})
      .innerJoin({cpt: 'class_pass_type'}, 'cp.class_pass_type', 'cpt.id')
      .innerJoin({joinTbl: 'classpasstype_video_groups__videogroup_class_pass_types'}, 'cpt.id', 'joinTbl.classpasstype_video_groups')
      .innerJoin({vg: 'video_group'}, 'vg.id', 'joinTbl.videogroup_class_pass_types')
      .innerJoin({videoJoinTbl: 'video_video_groups__videogroup_videos'}, 'videoJoinTbl.videogroup_videos', 'vg.id')
      .where('cp.user', userId)
      .andWhere('cp.archived', 0)
      .andWhere('cp.start_date', '<=', knex.raw('CURRENT_DATE()'))
      .andWhere('cp.valid_until', '>=', knex.raw('CURRENT_DATE()'))
      .andWhere('vg.archived', 0)
      .andWhere('videoJoinTbl.video_video_groups', videoId);

    if (validClassPasses.length) {
      return exits.success(true);
    }

    const validEventSignups = await knex({es: 'event_signup'})
      .innerJoin({e: 'event'}, 'es.event', 'e.id')
      .innerJoin({joinTbl: 'event_video_groups__videogroup_events'}, 'e.id', 'joinTbl.event_video_groups')
      .innerJoin({vg: 'video_group'}, 'vg.id', 'joinTbl.videogroup_events')
      .innerJoin({videoJoinTbl: 'video_video_groups__videogroup_videos'}, 'videoJoinTbl.videogroup_videos', 'vg.id').where('es.user', userId)
      .andWhere('es.archived', 0)
      .andWhere('vg.archived', 0)
      .andWhere('videoJoinTbl.video_video_groups', videoId);

    return exits.success(!!validEventSignups.length);

  },

};
