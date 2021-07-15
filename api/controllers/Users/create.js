const jwToken = require('../../services/jwTokens.js');
const {v4: uuidv4} = require('uuid');

module.exports = {

  friendlyName: 'Create user',

  inputs: {
    first_name: {
      type: 'string',
    },
    last_name: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    address_1: {
      type: 'string',
    },
    address_2: {
      type: 'string',
    },
    zip_code: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    country: {
      type: 'string',
    },
    phone: {
      type: 'string',
    },
    date_of_birth: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
      allowNull: true,
    },
    customer_additional_info: {
      type: 'string',
    },
    teacher_description: {
      type: 'string',
    },
    image: {
      type: 'number',
    },
    customer: {
      type: 'boolean',
    },
    teacher: {
      type: 'boolean',
    },
    checkin: {
      type: 'boolean',
    },
    admin: {
      type: 'boolean',
    },
    password: {
      type: 'string',
    },
    teacher_can_manage_all_classes: {
      type: 'boolean',
    }
  },

  fn: async function (inputs, exits) {

    if (this.req.authorizedRequestContext === 'admin') {
      // This is an admin creating a new user

      let existingUsers = await User.find({client: this.req.client.id, email: inputs.email, archived: false});

      if (existingUsers && existingUsers.length) {
        return exits.success('E_EMAIL_EXISTS');
      }

      let userData = _.chain(inputs)
        .pick([
          'first_name',
          'last_name',
          'email',
          'address_1',
          'address_2',
          'zip_code',
          'city',
          'country',
          'phone',
          'date_of_birth',
          'customer_additional_info',
          'teacher_description',
          'image',
          'customer',
          'teacher',
          'checkin',
          'admin',
          'teacher_can_manage_all_classes',
        ])
        .mapValues(str => str && str.trim ? str.trim() : str)
        .value();
      userData.client = this.req.client.id;
      userData.teacher_ical_token = uuidv4();

      // If image does not exist, remove reference
      let image;
      if (userData.image) {
        image = await Image.findOne(userData.image);
        if (!image) delete userData.image;
      }

      let user = await User.create(userData).fetch();

      if (userData.image) {
        await Image.update({id: userData.image}, {expires: 0});
      }

      return exits.success(user);


    } else {


      // This is someone creating a new account for themselves

      let existingUsers = await User.find({client: this.req.client.id, email: inputs.email, archived: false});

      if (_.isArray(existingUsers) && existingUsers.length) {
        return exits.success('E_EMAIL_EXISTS');
      }

      let userData = _.chain(inputs)
        .pick([
          'first_name',
          'last_name',
          'email',
          'address_1',
          'address_2',
          'zip_code',
          'city',
          'country',
          'phone',
          'date_of_birth',
          'customer_additional_info',
          'image',
        ])
        .mapValues(str => str && str.trim ? str.trim() : str)
        .value();
      userData.client = this.req.client.id;
      userData.customer = true;
      userData.teacher_ical_token = uuidv4();

      if (userData.image) {
        await Image.update({
          id: userData.image,
          archived: false,
        }, {
          expires: 0,
        });
      }


      const password = inputs.password.trim();
      userData.encrypted_password = await User.getEncryptedPassword(password);

      let user = await User.create(userData).fetch();

      await sails.helpers.email.customer.welcome.with({
        user,
        password
      });

      delete user.id_in_previous_booking_system;
      delete user.import_welcome_set_password_email_sent;

      // If user created successfully we return user and token as response

      // NOTE: payload is { id: user.id}
      return exits.success({user: user, token: jwToken.issue({id: user.id})});

    }

  },

};
