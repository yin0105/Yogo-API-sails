/**
 * Image.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    client: {
      model: 'Client',
    },

    original_filename: {
      type: 'string',
    },

    filename: {
      type: 'string',
    },

    expires: {
      type: 'number',
      // Timestamp
    },

  },

  customToJSON: function () {
    this.url = sails.config.IMAGE_SERVER + '/[image_size]/' + this.filename
    return this
  },

}

