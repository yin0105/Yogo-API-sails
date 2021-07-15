module.exports = {
  friendlyName: 'Create membership log entry',

  inputs: {
    membership: {
      type: 'ref',
      required: true
    },
    entry: {
      type: 'string',
      required: true
    },
  },

  fn: async (inputs, exits) => {

    const membership = await sails.helpers.util.objectFromObjectOrObjectId(inputs.membership, Membership);
    const userId = sails.helpers.util.idOrObjectIdInteger(membership.user_id || membership.user);
    const clientId = sails.helpers.util.idOrObjectIdInteger(membership.client_id || membership.client);

    await MembershipLog.create({
      client: clientId,
      user: userId,
      membership: membership.id,
      entry: inputs.entry,
    });

    return exits.success();

  }
}
