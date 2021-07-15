module.exports = {
  friendlyName: 'Create class pass log entry',

  inputs: {
    classPass: {
      type: 'ref',
      required: true
    },
    entry: {
      type: 'string',
      required: true
    },
  },

  fn: async (inputs, exits) => {

    const classPass = await sails.helpers.util.objectFromObjectOrObjectId(inputs.classPass, ClassPass);
    const userId = sails.helpers.util.idOrObjectIdInteger(classPass.user_id || classPass.user);
    const clientId = sails.helpers.util.idOrObjectIdInteger(classPass.client_id || classPass.client);

    await ClassPassLog.create({
      client_id: clientId,
      user_id: userId,
      class_pass_id: classPass.id,
      entry: inputs.entry,
    });

    return exits.success();

  }
}
