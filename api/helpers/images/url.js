const qs = require('qs');

module.exports = {
  friendlyName: 'Image URL',

  description: 'Returns the image URL',

  inputs: {
    image: {
      type: 'ref',
      description: 'The image object or id to retrieve the full image URL from.',
      required: true,
    },
    width: {
      type: 'number',
      description: 'The width of the resized image.',
      required: true,
    },
    height: {
      type: 'number',
      description: 'The height of the resized image.',
      required: true,
    },
    fit: {
      type: 'string',
      description: 'Optional fit type',
    },
  },

  exits: {
    success: {
      url: 'string',
    },
    imageNotFound: {
      description: 'Image was not found in the database.',
    },
    imageMissingFilename: {
      description: 'Filename is missing from database.',
    },
    dimensionsMalformed: {
      description: 'Provided `width` or `height` is malformed.',
    },
  },

  fn: async (inputs, exits) => {
    const imageId = sails.helpers.util.idOrObjectIdInteger(inputs.image);
    const image = await Image.findOne(imageId);

    if (!image) {
      throw 'imageNotFound';
    }

    if (!image.filename) {
      throw 'imageMissingFilename';
    }

    const {width, height} = inputs;

    if (width <= 0 || height <= 0) {
      throw 'dimensionsMalformed';
    }

    const queryParams = {
      w: width,
      h: height,
    };

    if (inputs.fit) {
      queryParams.fit = inputs.fit;
    }

    const query = qs.stringify(queryParams);

    return exits.success(
      `${sails.config.imgixServer}/${image.filename}?${query}`,
    );
  },
};
