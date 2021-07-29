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
      description: "Email address confirmed.",
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
    error: {
      statusCode: 400,
      description: 'Something went wrong',
    },
  },

  fn: async function (inputs, exits) {
    // if there is not token, then:
    if (!inputs.token) {
      return exits.invalidOrExpiredToken({
        error: "The provided token is expired, invalid, or already used up.",
      });
    }

    const client = await ClientSigningUp.findOne({ confirm_email_token: inputs.token });
    
    // if there is not pre-registered client or token is expired then: 
    if (!client || client.confirm_email_token_expires_at <= Date.now()) {
      return exits.invalidOrExpiredToken({
        error: "The provided token is expired, invalid, or already used up.",
      });
    }

    // see if the client exists in client table or user table
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

    // if a client in client_signing_up table is already archived, then operation cancel.
    // otherwise:
    if (client.archived === false) {
      console.log("Your account has been confirmed");
      const nowTimestamp = (new Date()).getTime();

      // Save the client into client table.
      const clientData = {
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
        archived: false,
        name: client.client_name,
        email: client.email,
      }

      const newClient = await Client.create(clientData).fetch();
      console.log("a record of client table is created.");

      // Save the client into client_settings table.
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

      // Save the client into user table.
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

      // all clients with the email are archived.
      await ClientSigningUp.update({email: client.email}, {archived: true}).fetch();
      console.log("all records with the email are archived.");

  // Send email
      const emailTransport = sails.helpers.email.getTransport();
      const emailLogger = sails.helpers.logger('email');
      const messageParams = {};
      messageParams.from = sails.config.email.sendAllEmailsTo;
            
      // send email to client
      messageParams.to = client.email;
      
      const admin_module_dashboard_link = ""
      const frontend_my_profile_link = ""
      const teacher_my_schedule_link = ""
      const checkin_link = ""

      messageParams.html = "<h3>" + sails.helpers.t('email.Subject', '', client.locale) + ":</h3>" + 
      sails.helpers.t('email.YourYogoDemoReady', '', client.locale) + !
      sails.helpers.t('email.Text', '', client.locale) + ":</h3><p>" + 
      sails.helpers.t('email.Dear', '', client.locale) + " " + inputs.first_name + ".</p>" + 
      sails.helpers.t('email.YourYogoDemoReady', '', client.locale) + ". " +
      sails.helpers.t('email.PleaseAllowIntroduction', '', client.locale) + ". " +
      sails.helpers.t('email.CanLogWithiEmailPassword', '', client.locale) + ". " +      
      "<h3>" + sails.helpers.t('email.AdminModule', '', client.locale) + ":</h3><p>" + 
      admin_module_dashboard_link + "</p>" +
      sails.helpers.t('email.WhereKeepTrack', '', client.locale) + ". " +
      sails.helpers.t('email.CustomersClassesEtc', '', client.locale) + ". " +
      "<h3>" + sails.helpers.t('email.CustomerModule', '', client.locale) + ":</h3><p>" + 
      frontend_my_profile_link + "</p>" +
      sails.helpers.t('email.WhereBuyRegister', '', client.locale) + ". " +      
      "<h3>" + sails.helpers.t('email.WebsiteWidget', '', client.locale) + "</h3>" + 
      sails.helpers.t('email.ModulesEasilyEmbeded', '', client.locale) + ". " +
      sails.helpers.t('email.WayYourCustomers', '', client.locale) + ". " +      
      "<h3>" + sails.helpers.t('email.TeacherModule', '', client.locale) + ":</h3><p>" + 
      teacher_my_schedule_link + "</p>" +
      sails.helpers.t('email.WhereYourTeachers', '', client.locale) + ". " +
      sails.helpers.t('email.AlsoWhereStartLiveStream', '', client.locale) + ". " +
      "<h3>" + sails.helpers.t('email.CheckinModule', '', client.locale) + ":</h3><p>" + 
      checkin_link + "</p>" +
      sails.helpers.t('email.CanRunOnTablet', '', client.locale) + ". " +      
      "<h3>" + sails.helpers.t('email.NativeApp', '', client.locale) + ":</h3>" + 
      sails.helpers.t('email.YogoNativeApp', '', client.locale) + ". "

      console.log("YOGO Email = ", messageParams.html);

      try {
        emailTransport.sendMail(
          messageParams,
          async function (err, info) {
            if (err) {
              console.log("send mail error : ", err);
              emailLogger.error('Mailgun error: ' + JSON.stringify(err));
            } else {
              console.log("send mail success");
              emailLogger.info('Mailgun response: ' + JSON.stringify(info));
              const mailgunId = info.id;
            }
          },
        );
      } catch (e) {
        emailLogger.error('Mailgun threw error: ' + e.message);
        return exits.error({
          message: 'Oops :) an error occurred',
          error: 'Something went wrong',
        });
      }

      // send YOGO email to kontakt@yogo.dk
      messageParams.to = "kontakt@yogo.dk";

      messageParams.html = "<p>" + sails.helpers.t('email.Hi', '', client.locale) + "</p>" + 
      "<p>" + sails.helpers.t('email.JustSignedForDemo', '', client.locale) + ": " + "</p>" + 
      "<p>" + sails.helpers.t('global.ID', '', client.locale) + ": " +  newClient.id + "</p>" + 
      "<p>" + sails.helpers.t('email.StudioName', '', client.locale) + ": " +  client.client_name + "</p>" + 
      "<p>" + sails.helpers.t('email.UserName', '', client.locale) + ": " +  client.first_name + " " + client.last_name  + "</p>" + 
      "<p>" + sails.helpers.t('email.Email', '', client.locale) + ": " +  client.email + "</p>"
      
      console.log("Client Email = ", messageParams.html);

      try {
        emailTransport.sendMail(
          messageParams,
          async function (err, info) {
            if (err) {
              console.log("send mail error : ", err);
              emailLogger.error('Mailgun error: ' + JSON.stringify(err));
            } else {
              console.log("send mail success");
              emailLogger.info('Mailgun response: ' + JSON.stringify(info));
              const mailgunId = info.id;
            }
          },
        );
      } catch (e) {
        emailLogger.error('Mailgun threw error: ' + e.message);
        return exits.error({
          message: 'Oops :) an error occurred',
          error: 'Something went wrong',
        });
      }

      console.log("signup confirm");
      this.res.location('http://localhost:8086/onboarding/signup-confirm');
          
    } else {
      return exits.emailAlreadyInUse({
        message: 'Oops :) an error occurred',
        error: 'This email address already exits',
      });
    }


  },

};
