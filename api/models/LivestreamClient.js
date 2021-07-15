/**
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'livestream_client',

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

    liveswitch_client_id: 'string',

    role: 'string',

    user_agent: 'string',

    user_agent_parsed: 'json',

  },

  customToJSON() {
    this.user_agent_parsed = JSON.parse(this.user_agent_parsed);

    return this;
  }

}

