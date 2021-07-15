module.exports = {
  friendlyName: 'Destroy class type',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    const existingClassType = await ClassType.findOne(inputs.id);

    await ClassType.update({id: inputs.id}, {
      archived: true,
      class_pass_types: [],
      membership_types: [],
      class_pass_types_livestream: [],
      membership_types_livestream: [],
      class_type_emails: [],
    });

    if (existingClassType.image) {
      await Image.update({id: existingClassType.image}, {archived: true});
    }

    return exits.success();
  },
};
