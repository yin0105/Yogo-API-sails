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
    invalidToken: {
      statusCode: 400,
      description:
        "The provided token is invalid, or already used up.",
    },
    expiredToken: {
      statusCode: 400,
      description:
        "The provided token is expired.",
    },
    emailAlreadyInUse: {
      statusCode: 400,
      description: 'Email address already in use',
    },
    sendingMailFailed: {
      statusCode: 400,
      description: 'Sending mail failed',
    },
    error: {
      statusCode: 400,
      description: 'Something went wrong',
    },
  },

  fn: async function (inputs, exits) {
    // if there is not token, then:
    if (!inputs.token) {
      return exits.invalidToken({
        error: "The provided token is invalid, or already used up.",
      });
    }

    // let response = await sails.policies.getClient.with({
    //   non_user_email: messageParams.to,
    //   subject: messageParams.subject,
    //   html: messageParams.html,
    //   emailType: 'yogo_email_after_confirm_email',
    // });

    const client = await ClientSigningUp.findOne({ confirm_email_token: inputs.token });
    
    // if there is not pre-registered client or token is expired then: 
    if (!client) {
      return exits.invalidToken({
        error: "The provided token is invalid, or already used up.",
      });
    }

    if (client.confirm_email_token_expires_at <= Date.now()) {
      return exits.expiredToken({
        error: "The provided token is expired.",
      });
    }

    // see if the client exists in client table or user table
    const existingClient = await Client.findOne({email: client.email});
    // const existingUser = await User.findOne({email: client.email});

    // if (existingClient || existingUser) {
    if (existingClient) {
      return exits.emailAlreadyInUse({
        message: 'Oops :) an error occurred',
        error: 'This email address already exits.',
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
      // const clientSettingsData = {
      //   createdAt: nowTimestamp,
      //   updatedAt: nowTimestamp,
      //   archived: false,
      //   key: 'locale',
      //   value: client.locale,
      // }

      // const newClientSettings = await ClientSettings.create(clientSettingsData).fetch();

      // const clientSettingsData_2 = {
      //   createdAt: nowTimestamp,
      //   updatedAt: nowTimestamp,
      //   archived: false,
      //   key: 'sms_sender_name',
      //   value: client.client_name.substr(0, 11),
      // }

      // const newClientSettings_2 = await ClientSettings.create(clientSettingsData_2).fetch();
      // console.log("a record of client_settings table is created.");
      
      let response = await sails.helpers.clientSettings.update(newClient.id, {"locale": client.locale});
      console.log("a record of client_settings table is created.");

      response = await sails.helpers.clientSettings.update(newClient.id, {"sms_sender_name": client.client_name.substr(0, 11)});
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
        client: newClient.id,
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
      
      const admin_module_dashboard_link = `https://${newClient.id}.yogo.dk/admin/index.html#/dashboard`
      const frontend_my_profile_link = `https://${newClient.id}.yogo.dk/frontend/index.html#/my-profile`
      const teacher_my_schedule_link = `https://${newClient.id}.yogo.dk/teacher/index.html#/my-schedule`
      const checkin_link = `https://${newClient.id}.yogo.dk/checkin/index.html#/checki`

      messageParams.subject = sails.helpers.t('email.YourYogoDemoReady', '', client.locale) + "!"

      messageParams.html = `<p>${sails.helpers.t('email.Dear', '', client.locale)} ${inputs.first_name} + .</p>` + 
      `${sails.helpers.t('email.YourYogoDemoReady', '', client.locale)} ` +
      `${sails.helpers.t('email.PleaseAllowIntroduction', '', client.locale)} ` +
      `${sails.helpers.t('email.CanLogWithiEmailPassword', '', client.locale)} ` +
      
      `<h3>${sails.helpers.t('email.AdminModule', '', client.locale)}:</h3>` +
      `<p>${admin_module_dashboard_link}:</p>` +
      `${sails.helpers.t('email.WhereKeepTrack', '', client.locale)} ` +
      `${sails.helpers.t('email.CustomersClassesEtc', '', client.locale)} ` +

      `<h3>${sails.helpers.t('email.CustomerModule', '', client.locale)}:</h3>` +
      `<p>${frontend_my_profile_link}:</p>` +
      `${sails.helpers.t('email.WhereBuyRegister', '', client.locale)} ` +

      `<h3>${sails.helpers.t('email.WebsiteWidget', '', client.locale)}:</h3>` +
      `${sails.helpers.t('email.ModulesEasilyEmbeded', '', client.locale)} ` +
      `${sails.helpers.t('email.WayYourCustomers', '', client.locale)} ` +

      `<h3>${sails.helpers.t('email.TeacherModule', '', client.locale)}:</h3>` +
      `<p>${teacher_my_schedule_link}:</p>` +
      `${sails.helpers.t('email.WhereYourTeachers', '', client.locale)} ` +
      `${sails.helpers.t('email.AlsoWhereStartLiveStream', '', client.locale)} ` +

      `<h3>${sails.helpers.t('email.CheckinModule', '', client.locale)}:</h3>` +
      `<p>${checkin_link}:</p>` +
      `${sails.helpers.t('email.CanRunOnTablet', '', client.locale)} ` +

      `<h3>${sails.helpers.t('email.NativeApp', '', client.locale)}:</h3>` +
      `${sails.helpers.t('email.YogoNativeApp', '', client.locale)} `


      console.log("YOGO Email = ", messageParams.html);

      logger.info('Sending "Demo is ready" email with subject ' + messageParams.subject + ' to user ' + client.email);
      await sails.helpers.email.send.with({
        user: newUser,
        subject: messageParams.subject,
        html: messageParams.html,
        emailType: 'client_email_after_confirm_email',
      });

      // try {
      //   emailTransport.sendMail(
      //     messageParams,
      //     async function (err, info) {
      //       if (err) {
      //         console.log("send mail error : ", err);
      //         emailLogger.error('Mailgun error: ' + JSON.stringify(err));
      //         return exits.sendingMailFailed({
      //           message: 'Oops :) an error occurred',
      //           error: 'Sending mail failed',
      //         });
      //       } else {
      //         console.log("send mail success");
      //         emailLogger.info('Mailgun response: ' + JSON.stringify(info));
      //         const mailgunId = info.id;
      //       }
      //     },
      //   );
      // } catch (e) {
      //   emailLogger.error('Mailgun threw error: ' + e.message);
      //   return exits.sendingMailFailed({
      //     message: 'Oops :) an error occurred',
      //     error: 'Sending mail failed',
      //   });
      // }

      // send YOGO email to kontakt@yogo.dk
      messageParams.to = "kontakt@yogo.dk";

      messageParams.html = "<p>" + sails.helpers.t('email.Hi', '', client.locale) + "</p>" + 
      "<p>" + sails.helpers.t('email.JustSignedForDemo', '', client.locale) + ": " + "</p>" + 
      "<p>" + sails.helpers.t('global.ID', '', client.locale) + ": " +  newClient.id + "</p>" + 
      "<p>" + sails.helpers.t('email.StudioName', '', client.locale) + ": " +  client.client_name + "</p>" + 
      "<p>" + sails.helpers.t('email.UserName', '', client.locale) + ": " +  client.first_name + " " + client.last_name  + "</p>" + 
      "<p>" + sails.helpers.t('email.Email', '', client.locale) + ": " +  client.email + "</p>"
      
      console.log("Client Email = ", messageParams.html);
      logger.info('Sending "Demo is ready" email with subject ' + messageParams.subject + ' to user ' + client.email);
      await sails.helpers.email.send.with({
        non_user_email: messageParams.to,
        subject: messageParams.subject,
        html: messageParams.html,
        emailType: 'yogo_email_after_confirm_email',
      });

      // try {
      //   emailTransport.sendMail(
      //     messageParams,
      //     async function (err, info) {
      //       if (err) {
      //         console.log("send mail error : ", err);
      //         emailLogger.error('Mailgun error: ' + JSON.stringify(err));
      //         return exits.sendingMailFailed({
      //           message: 'Oops :) an error occurred',
      //           error: 'Sending mail failed',
      //         });
      //       } else {
      //         console.log("send mail success");
      //         emailLogger.info('Mailgun response: ' + JSON.stringify(info));
      //         const mailgunId = info.id;
      //       }
      //     },
      //   );
      // } catch (e) {
      //   emailLogger.error('Mailgun threw error: ' + e.message);
      //   return exits.sendingMailFailed({
      //     message: 'Oops :) an error occurred',
      //     error: 'Sending mail failed',
      //   });
      // }

      console.log("signup confirm: ", client.first_name);
      return exits.success({
        first_name: client.first_name,
        admin_module_dashboard_link: admin_module_dashboard_link,
        frontend_my_profile_link: frontend_my_profile_link,
        teacher_my_schedule_link: teacher_my_schedule_link,
        checkin_link: checkin_link,
      })

    } else {
      return exits.emailAlreadyInUse({
        message: 'Oops :) an error occurred',
        error: 'This email address already exits.',
      });
    }
  },

};
