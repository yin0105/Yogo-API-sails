module.exports = {
  friendlyName: 'Create class livestream signup',

  inputs: {
    user: {
      type: 'number',
      required: true,
    },
    'class': {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    const can = await sails.helpers.can2('controller.ClassLivestreamSignups.create', this.req)
      .tolerate('classHasStarted', async () => {
        const errorResponse = await sails.helpers.applicationError.buildResponse('classHasStarted', this.req);
        exits.success(errorResponse)
        return null
      });

    if (can === null) return;
    if (can === false) return exits.forbidden();

    let result = await sails.helpers.classes.createLivestreamSignup.with({
      user: inputs.user,
      classItem: inputs.class,
    })
      .tolerate('alreadySignedUp', async () => {
        const errorResponse = await sails.helpers.applicationError.buildResponse('alreadySignedUp', this.req);
        exits.success(errorResponse)
        return false
      })
      .tolerate('classCancelled', async () => {
        const errorResponse = await sails.helpers.applicationError.buildResponse('classCancelled', this.req);
        exits.success(errorResponse)
        return false
      })
      .tolerate('classIsFull', async () => {
        const errorResponse = await sails.helpers.applicationError.buildResponse('classIsFull', this.req);
        exits.success(errorResponse)
        return false
      })
      .tolerate('noAccess', async () => {
        const errorResponse = await sails.helpers.applicationError.buildResponse('noAccess', this.req);
        exits.success(errorResponse)
        return false
      })

    if (!result) return;

    if (result.used_class_pass || result.used_class_pass_id) {
      const classPassId = sails.helpers.util.idOrObjectIdInteger(result.used_class_pass_id || result.used_class_pass);
      const classPass = await ClassPass.findOne(classPassId).populate('class_pass_type');
      if (classPass.class_pass_type.pass_type === 'fixed_count') {
        const classDescription = await sails.helpers.classes.getDescription(result.class_id || result.class);
        const logMessage = sails.helpers.t(
          'classPassLog.classPassUsedToSignUpForLivestreamForClass',
          [classDescription, classPass.classes_left],
        );
        await sails.helpers.classPassLog.log(classPass, logMessage);
      }
    }

    return exits.success(result)

  },

}
