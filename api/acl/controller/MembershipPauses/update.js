const MembershipPauseObjection = require('../../../objection-models/MembershipPause');
module.exports = {
  /*async customer(req, inputs) {
    const membershipPause = await MembershipPauseObjection.query().findById(inputs.id).eager('membership.user');
    return parseInt(membershipPause.membership.user.id) === parseInt(req.user.id);
  },*/

  async admin(req, inputs) {
    const membershipPause = await MembershipPauseObjection.query()
      .findById(inputs.id)
      .eager('client');
    return parseInt(membershipPause.client.id) === parseInt(req.client.id);
  },
};
