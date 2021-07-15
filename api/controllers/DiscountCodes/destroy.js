module.exports = {
  friendlyName: 'Destroy discount code',

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.DiscountCodes.destroy', this.req))) {
      return exits.forbidden()
    }

    await DiscountCode.update({id: this.req.param('id')}, {archived: true})

    return exits.success()
  },
}
