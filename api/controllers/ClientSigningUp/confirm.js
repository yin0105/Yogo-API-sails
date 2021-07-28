const jwToken = require('../../services/jwTokens.js');
const {v4: uuidv4} = require('uuid');

module.exports = {

  friendlyName: 'Confirm user',

  inputs: {
    token: {
      type: 'string',
      description: "The confirmation token from the email.",
      example: "4-32fad81jdaf$329",
    },
  },

  exits: {
    success: {
      description: "Email address confirmed and requesting user logged in.",
    },
    invalidOrExpiredToken: {
      statusCode: 400,
      description:
        "The provided token is expired, invalid, or already used up.",
    },
    emailAlreadyInUse: {
      statusCode: 400,
      description: 'Email address already in use',
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.token) {
      return exits.invalidOrExpiredToken({
        error: "The provided token is expired, invalid, or already used up.",
      });
    }

    const client = await ClientSigningUp.findOne({ confirm_email_token: inputs.token });
    
    if (!client || client.confirm_email_token_expires_at <= Date.now()) {
      return exits.invalidOrExpiredToken({
        error: "The provided token is expired, invalid, or already used up.",
      });
    }

    const existingClient = await Client.findOne({email: client.email});
    const existingUser = await User.findOne({email: client.email});
    console.log("existing client = ", existingClient);
    console.log("existing user = ", existingUser);
    if (existingClient || existingUser) {
      return exits.emailAlreadyInUse({
        message: 'Oops :) an error occurred',
        error: 'This email address already exits',
      });
    }

    if (client.archived === false) {
      console.log("Your account has been confirmed");
      const nowTimestamp = (new Date()).getTime();

      const clientData = {
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
        archived: false,
        name: client.client_name,
        email: client.email,
      }

      const newClient = await Client.create(clientData).fetch();
      console.log("a record of client table is created.");

      const clientSettingsData = {
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
        archived: false,
        key: 'locale',
        value: client.locale,
      }

      const newClientSettings = await ClientSettings.create(clientSettingsData).fetch();
      console.log("a record of client_settings table is created.");

      const clientSettingsData_2 = {
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
        archived: false,
        key: 'sms_sender_name',
        value: client.client_name.substr(0, 11),
      }

      const newClientSettings_2 = await ClientSettings.create(clientSettingsData_2).fetch();
      console.log("a record of client_settings table is created.");

      const userData = {
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
        archived: false,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        email_confirmed: true,
        encrypted_password: client.encrypted_password,
        admin: true,
        teacher: true,
        checkin: true,
        customer: true,
      }

      const newUser = await User.create(userData).fetch();
      console.log("a record of User table is created.");


      // await User.updateOne({ id: user.id }).set({
      //   emailStatus: "confirmed",
      //   emailProofToken: "",
      //   emailProofTokenExpiresAt: 0,
      // });
      // return exits.success({
      //   message: "Your account has been confirmed",
      // });
    } else {
      return exits.emailAlreadyInUse({
        message: 'Oops :) an error occurred',
        error: 'This email address already exits',
      });
    }


  },

};
