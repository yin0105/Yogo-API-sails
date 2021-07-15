module.exports = {

  friendlyName: 'Destroy class waiting list signup',

  exits: {
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {

    const can = await sails.helpers.can2('controller.ClassWaitingListSignups.destroy', this.req)

    if (can === false) return exits.forbidden()

    await sails.helpers.classWaitingListSignups.destroy(this.req.param('id'));

    return exits.success()

  }

}
