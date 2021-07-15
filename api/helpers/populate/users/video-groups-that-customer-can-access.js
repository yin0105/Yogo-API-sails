const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Populate videos that customer can access through memberships, class passes or events',

  inputs: {
    users: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.users.length) {
      return exits.success([]);
    }

    if (typeof inputs.users[0].video_groups_that_customer_can_access !== 'undefined') {
      return exits.success();
    }

    const clientId = inputs.users[0].client_id
      || sails.helpers.util.idOrObjectIdInteger(inputs.users[0].client);

    const videoGroupsOpenToAll = await knex({vg: 'video_group'})
      .select('vg.id')
      .where({
        'vg.public_access': 1,
        'vg.archived': 0,
        'vg.client': clientId,
      });

    // TODO: Optimize for more than one user

    for (let i = 0; i < inputs.users.length; i++) {

      const user = inputs.users[i];

      const allowedVideoGroupIdsThroughMemberships = await knex({vg: 'video_group'})
        .select('vg.id')
        .innerJoin({joinTbl: 'membershiptype_video_groups__videogroup_membership_types'}, 'joinTbl.videogroup_membership_types', 'vg.id')
        .innerJoin({mt: 'membership_type'}, 'joinTbl.membershiptype_video_groups', 'mt.id')
        .innerJoin({m: 'membership'}, 'mt.id', 'm.membership_type')
        .where('m.status', 'in', ['active', 'cancelled_running'])
        .andWhere('m.archived', 0)
        .andWhere('vg.archived', 0)
        .andWhere('m.user', user.id);

      const today = moment.tz('Europe/Copenhagen').format('YYYY-MM-DD');
      const allowedVideoGroupIdsThroughClassPasses = await knex({vg: 'video_group'})
        .select('vg.id')
        .innerJoin({joinTbl: 'classpasstype_video_groups__videogroup_class_pass_types'}, 'joinTbl.videogroup_class_pass_types', 'vg.id')
        .innerJoin({cpt: 'class_pass_type'}, 'joinTbl.classpasstype_video_groups', 'cpt.id')
        .innerJoin({cp: 'class_pass'}, 'cpt.id', 'cp.class_pass_type')
        .where('cp.start_date', '<=', today)
        .andWhere('cp.valid_until', '>=', today)
        .andWhere('cp.archived', 0)
        .andWhere('vg.archived', 0)
        .andWhere('cp.user', user.id);

      const allowedVideoGroupIdsThroughEvents = await knex({vg: 'video_group'})
        .select('vg.id')
        .innerJoin({joinTbl: 'event_video_groups__videogroup_events'}, 'joinTbl.videogroup_events', 'vg.id')
        .innerJoin({e: 'event'}, 'joinTbl.event_video_groups', 'e.id')
        .innerJoin({es: 'event_signup'}, 'e.id', 'es.event')
        .andWhere('e.archived', 0)
        .andWhere('es.archived', 0)
        .andWhere('vg.archived', 0)
        .andWhere('es.user', user.id);

      const allowedVideoGroupIds = _.chain(allowedVideoGroupIdsThroughMemberships)
        .concat(allowedVideoGroupIdsThroughClassPasses, allowedVideoGroupIdsThroughEvents, videoGroupsOpenToAll)
        .map('id')
        .uniq()
        .value();

      user.video_groups_that_customer_can_access = await VideoGroup.find({
        id: allowedVideoGroupIds,
      }).populate('videos', {archived: false});

    }

    return exits.success();

  },
};
