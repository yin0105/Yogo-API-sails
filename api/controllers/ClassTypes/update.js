module.exports = {
  friendlyName: 'Update class type',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    name: {
      type: 'string',
    },
    color: {
      type: 'string',
      custom: c => c.match(/^#[\da-fA-F]{6}$/),
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
    },
  },

  exits: {
    notFound: {
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {

    const existingClassType = await ClassType.findOne({
      id: inputs.id,
      client: this.req.client.id,
      archived: 0,
    });
    if (!existingClassType) {
      return exits.notFound();
    }
    if (existingClassType.image && existingClassType.image !== inputs.image) {
      await Image.update({id: existingClassType.image}, {archived: true});
    }

    const [updatedClassType] = await ClassType.update(
      {id: inputs.id},
      _.omit(inputs, 'id'),
    ).fetch();

    if (inputs.image) {
      await Image.update({id: inputs.image}, {expires: 0});
    }

    return exits.success(updatedClassType);

  },
};
