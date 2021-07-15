const PriceGroupObj = require('../../objection-models/PriceGroup');
const MembershipTypeObj = require('../../objection-models/MembershipType');
const VideoGroupObj = require('../../objection-models/VideoGroup');
const ClassPassTypeObj = require('../../objection-models/ClassPassType');


module.exports = {
  friendlyName: 'Get price groups that can give access to a video',

  inputs: {
    videoId: {
      type: 'number',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const video = await Video.findOne(inputs.videoId);

    //console.log('video: ', video);

    const videoGroupsWithVideo = await VideoGroupObj.query().alias('vg')
      .joinRelation('videos', {alias: 'v'})
      .where({
        'v.id': inputs.videoId,
        'vg.archived': 0,
      });

    //console.log('videoGroupsWithVideo:', videoGroupsWithVideo);


    const membershipTypesWithAllAccess = await knex({mt: 'membership_type'})
      .where({
        client: video.client,
        archived: 0,
        access_all_videos: 1,
      });

    //console.log('membershipTypesWithAllAccess', membershipTypesWithAllAccess);

    const membershipTypesWithAccessThroughVideoGroup = await MembershipTypeObj.query().alias('mt')
      .joinRelation('video_groups', {alias: 'vg'})
      .where({
        'mt.client': video.client,
        'mt.archived': 0,
      })
      .andWhere('vg.id', 'in', _.map(videoGroupsWithVideo, 'id'))
      .groupBy('mt.id');

    //console.log('membershipTypesWithAccessThroughVideoGroup:', membershipTypesWithAccessThroughVideoGroup);

    const allMembershipTypes = _.concat(membershipTypesWithAllAccess, membershipTypesWithAccessThroughVideoGroup);

    const priceGroupsThatHoldsMembershipTypes = await PriceGroupObj.query().alias('pg')
      .joinRelation('membership_types', {alias: 'mt'})
      .where({
        'pg.archived': 0,
      })
      .andWhere('mt.id', 'in', _.map(allMembershipTypes, 'id'))
      .groupBy('pg.id');

    //console.log('priceGroupsThatHoldsMembershipTypes:', priceGroupsThatHoldsMembershipTypes);

    const classPassTypesWithAllAccess = await knex({cpt: 'class_pass_type'})
      .where({
        client: video.client,
        archived: 0,
        access_all_videos: 1,
      });

    //console.log('classPassTypesWithAllAccess:', classPassTypesWithAllAccess);

    const classPassTypesWithAccessThroughVideoGroup = await ClassPassTypeObj.query().alias('cpt')
      .joinRelation('video_groups', {alias: 'vg'})
      .where({
        'cpt.client': video.client,
        'cpt.archived': 0,
      })
      .andWhere('vg.id', 'in', _.map(videoGroupsWithVideo, 'id'))
      .groupBy('cpt.id');

    //console.log('classPassTypesWithAccessThroughVideoGroup', classPassTypesWithAccessThroughVideoGroup);

    const allClassPassTypes = _.concat(classPassTypesWithAllAccess, classPassTypesWithAccessThroughVideoGroup);

    const priceGroupsThatHoldsClassPassTypes = await PriceGroupObj.query().alias('pg')
      .joinRelation('class_pass_types', {alias: 'cpt'})
      .where({
        'pg.archived': 0,
      })
      .andWhere('cpt.id', 'in', _.map(allClassPassTypes, 'id'))
      .groupBy('pg.id');

    //console.log('priceGroupsThatHoldsClassPassTypes:', priceGroupsThatHoldsClassPassTypes);

    const priceGroups = _.chain(priceGroupsThatHoldsMembershipTypes)
      .concat(priceGroupsThatHoldsClassPassTypes)
      .uniqBy('id')
      .value();

    return exits.success(priceGroups);

  },
};
