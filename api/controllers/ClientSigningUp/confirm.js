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

      console.log("clientData = ", clientData);
      const newClient = await ClientSigningUp.create(clientData).fetch();
      console.log("a record of client table is created.");
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
