module.exports = {
  friendlyName: 'Destroy (archive) gift card',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.GiftCards.destroy', this.req, inputs)) {
      return exits.forbidden();
    }

    await GiftCard.update({id: inputs.id}, {archived: true});

    await sails.helpers.giftCardLog.log(
      inputs.id,
      sails.helpers.t(
        'giftCardLog.GiftCardDeletedByAdminWithUser',
        [`${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id})`]
      ),
    );

    return exits.success();

  },
};
