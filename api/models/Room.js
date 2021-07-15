/**
 * Room.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const validator = require('validator')
const ValidationError = require('../errors/ValidationError')

module.exports = {

  attributes: {

    client: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    branch: {
      model: 'Branch',
    },

  },

  async validate(room) {
    room = _.pick(room, [
      'name',
      'branch',

    ])
    room.name = room.name.substr(0, 50)
    if (!room.name) {
      throw new ValidationError({message: 'E_FIELD_MISSING', field: 'name'})
    }

    return room


  },
}

