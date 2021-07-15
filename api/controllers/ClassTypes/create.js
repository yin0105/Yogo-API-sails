module.exports = {
  friendlyName: 'Create class type',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    color: {
      type: 'string',
      custom: c => c.match(/^#[\da-fA-F]{6}$/),
      required: true,
    },
    image: {
      type: 'number',
      allowNull: true,
    },
    description: {
      type: 'string',
    },
    class_pass_types: {
      type: 'json',
      custom: arr => arr.every(Number.isInteger),
    },
    membership_types: {
      type: 'json',
      custom: arr => arr.every(Number.isInteger),
    },
    class_pass_types_livestream: {
      type: 'json',
      custom: arr => arr.every(Number.isInteger),
    },
    membership_types_livestream: {
      type: 'json',
      custom: arr => arr.every(Number.isInteger),
    },
    class_type_emails: {
      type: 'json',
      custom: arr => arr.every(Number.isInteger),
    }
  },

  fn: async function (inputs, exits) {

    const classTypeData = {
      ...inputs,
      client: this.req.client.id,
    };

    const createdClassType = await ClassType.create(
      classTypeData,
    ).fetch();

    if (inputs.image) {
      await Image.update({id: inputs.image}, {expires: 0});
    }

    return exits.success(createdClassType);
  },
};
