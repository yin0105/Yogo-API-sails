/**
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'livestream_connection_event',

  attributes: {

    client: {
      model: 'Client',
    },

    'class': {
      model: 'Class',
    },

    user: {
      model: 'User',
    },

    event_timestamp: 'number',

    event_type: {
      type: 'string',
      isIn: ['initializing', 'connecting', 'connected', 'closing', 'closed', 'failing', 'failed', 'updated'],
    },

    liveswitch_client_id: 'string'

  },

}

