/**
 * ClientSigningUp.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

 module.exports = {

    tableName: 'client_signing_up',
  
    attributes: {
  
      client_name: 'string',
  
      first_name: 'string',
  
      last_name: 'string',
  
      email: {
        type: 'string',
        isEmail: true,
        required: true,
      },
  
      confirm_email_token: 'string',
  
      confirm_email_token_expires_at: 'number',
  
      encrypted_password: 'string',
  
      locale: 'string'
  
    },
  
  };