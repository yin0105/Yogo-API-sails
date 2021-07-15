/**
 * Users.js
 *
 * @description :: Users are global for each client, so a user kan be both a customer and an admin. But for separate clients, users are separate, meaning they can have different profiles, with same email, on different clients.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

// We don't want to store password with out encryption
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const md5 = require('md5')
const moment = require('moment')

const wordpressHasher = require('wordpress-hash-node')

module.exports = {

  schema: true,

  attributes: {

    client: {
      model: 'Client',
    },

    email: {
      type: 'string',
      isEmail: true,
      required: true,
      unique: false, // Users can use the same email on different clients.
    },

    email_confirmed: {
      type: 'Boolean',
      defaultsTo: false,
    },

    first_name: {
      type: 'string',
    },

    last_name: {
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

    image: {
      model: 'Image',
    },

    customer: {
      type: 'Boolean',
    },

    teacher: {
      type: 'Boolean',
    },
    admin: {
      type: 'Boolean',
    },

    checkin: 'boolean',

    teaching_event_groups: {
      collection: 'EventGroup',
      via: 'teachers',
    },

    teaching_events: {
      collection: 'Event',
      via: 'teachers',
    },

    teaching_classes: {
      collection: 'Class',
      via: 'teachers',
    },

    date_of_birth: {
      type: 'ref',
      columnType: 'date',
      defaultsTo: null,
    },

    class_signups: {
      collection: 'ClassSignup',
      via: 'user',
    },

    class_waiting_list_signups: {
      collection: 'ClassWaitingListSignup',
      via: 'user',
    },

    class_livestream_signups: {
      collection: 'ClassLivestreamSignup',
      via: 'user'
    },

    event_signups: {
      collection: 'EventSignup',
      via: 'user',
    },

    class_passes: {
      collection: 'ClassPass',
      via: 'user',
    },

    memberships: {
      collection: 'Membership',
      via: 'user',
    },

    teacher_description: {
      type: 'string',
      columnType: 'text',
    },

    customer_additional_info: {
      type: 'string',
      columnType: 'text',
    },

    encrypted_password: {
      type: 'string',
    },

    reset_password_token: {
      type: 'string',
    },

    reset_password_token_expires: {
      type: 'number',
    },

    cart_items: {
      collection: 'CartItem',
      via: 'user',
    },

    id_in_previous_booking_system: {
      type: 'string'
    },

    import_welcome_set_password_email_sent: {
      type: 'boolean',
      defaultsTo: false
    },

    teacher_ical_token: 'string',

    teacher_can_manage_all_classes: 'boolean',

    teaching_videos: {
      collection: 'Video',
      via: 'user_id',
      through: 'VideoTeacher'
    },

    video_favorites: {
      collection: 'Video',
      via: 'user_id',
      through: 'UserVideoFavorite',
    },

    livestream_time_display_mode: {
      type: 'string',
      isIn: ['elapsed', 'remaining'],
      defaultsTo: 'remaining',
      allowNull: true,
    }

  },


  customToJSON: function () {
    // We don't wan't to send back encrypted password or other security related information
    let user = _.omit(this, [
      'encrypted_password',
      'reset_password_token',
      'reset_password_token_expires',
      'teacher_ical_token',
    ])

    // Api always sends dates in simple format
    //console.log('user.date_of_birth, before toJSON:', user.date_of_birth);
    //console.log('user.date_of_birth, in Copenhagen timezone:',moment(user.date_of_birth).tz('Europe/Copenhagen'))
    user.date_of_birth = user.date_of_birth && user.date_of_birth !== '0000-00-00' ? moment(user.date_of_birth).format('YYYY-MM-DD') : null;
    //console.log('user.date_of_birth, after toJSON:', user.date_of_birth);

    // Add info on access to exp features, if applicable
    if (sails.config.usersWithAccessToExperimentalFeatures && sails.config.usersWithAccessToExperimentalFeatures.replace(/ /g, '').split(',').indexOf(user.email) > -1) {
      user.show_experimental_features = true
    }
    return user

  },


  async getEncryptedPassword(password) {

    const salt = await bcrypt.genSalt(10)

    return await bcrypt.hash(password, salt)

  },


  async comparePassword(password, user) {

    if (!_.isObject(user)) {
      user = await User.findOne(user)
    }

    const match = await bcrypt.compare(password, user.encrypted_password)

    if (match) {
      return true
    }


    if (md5(password) === user.encrypted_password) {

      const encryptedPassword = await User.getEncryptedPassword(password)

      await User.update(
        {
          id: user.id,
        },
        {
          encrypted_password: encryptedPassword,
        },
      )
      return true
    }


    if (wordpressHasher.CheckPassword(password, user.encrypted_password)) {

      const encryptedPassword = await User.getEncryptedPassword(password)

      await User.update(
        {
          id: user.id,
        },
        {
          encrypted_password: encryptedPassword,
        },
      )
      return true
    }


    return false
  },


  async createAndReturnResetPasswordToken(user, tokenDuration) {

    if (!_.isObject(user)) {
      user = User.findOne(user)
    }

    tokenDuration = Math.min(Math.abs(parseInt(tokenDuration)), 2592000) // No token should last more than a month

    if (!tokenDuration) tokenDuration = 3600


    const token = crypto.randomBytes(32).toString('hex')

    await User.update(
      {
        id: user.id,
      },
      {
        reset_password_token: token,
        reset_password_token_expires: Math.floor(Date.now() / 1000) + tokenDuration,
      },
    )

    return (token)

  },

  checkPasswordStrength(password) {
    return password.match(/[a-z]+/) && password.match(/[A-Z]+/) && password.match(/[0-9]+/) && password.length >= 6
  },

}

