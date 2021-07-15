module.exports = {
  friendlyName: 'Populate membership campaign',

  inputs: {
    memberships: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.memberships.length) {
      return exits.success([]);
    }

    if (inputs.memberships[0].membership_campaign && inputs.memberships[0].membership_campaign.id) {
      return exits.success();
    }

    const membershipCampaignIds = _.compact(_.map(inputs.memberships, 'membership_campaign'));
    const membershipCampaigns = await MembershipCampaign.find({
        id: membershipCampaignIds,
      })
    ;

    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];
      if (membership.membership_campaign) {
        membership.membership_campaign_id = membership.membership_campaign;
        membership.membership_campaign = _.find(membershipCampaigns, {id: membership.membership_campaign});
      } else {
        membership.membership_campaign_id = null;
      }

    }

    return exits.success();
  },
};
