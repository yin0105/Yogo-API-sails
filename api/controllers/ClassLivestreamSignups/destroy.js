module.exports = {

  friendlyName: 'Destroy class livestream signup',

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    const can = await sails.helpers.can2('controller.ClassLivestreamSignups.destroy', this.req)
      .tolerate('classHasStarted', () => {
        exits.success('E_CLASS_HAS_STARTED');
        return null;
      });

    if (can === null) return;
    if (can === false) return exits.forbidden();

    const userGetsRefundAfterDeadline = this.req.authorizedRequestContext === 'admin'
      || this.req.authorizedRequestContext === 'teacher';

    await sails.helpers.classLivestreamSignups.destroy.with({
      signup: this.req.param('id'),
      userGetsRefundAfterDeadline: userGetsRefundAfterDeadline,
    });

    return exits.success();

  },
};
