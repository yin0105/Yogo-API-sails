const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);
const moment = require('moment');

const publicSelects = [
  'first_name',
  'last_name',
  'image',
  'teacher_description',
];

const adminSelects = [
  'first_name',
  'last_name',
  'address_1',
  'address_2',
  'zip_code',
  'city',
  'country',
  'phone',
  'email',
  'date_of_birth',
  'image',
  'customer_additional_info',
  'teacher_description',
  'teacher',
  'customer',
  'admin',
  'checkin',
];

class User extends Model {

  static get modifiers() {
    return {
      publicSelects(query) {
        query.select(publicSelects);
      },
      adminSelects(query) {
        query.select(adminSelects);
      },
    };
  }

  static get tableName() {
    return 'user';
  }

  static get relationMappings() {
    const Class = require('./Class');
    const ClassPass = require('./ClassPass');
    const ClassSignup = require('./ClassSignup');
    const ClassLivestreamSignup = require('./ClassLivestreamSignup');
    const ClassWaitingListSignup = require('./ClassWaitingListSignup');
    const Membership = require('./Membership');
    const EventSignup = require('./EventSignup');
    const Image = require('./Image');
    const Order = require('./Order');
    const Event = require('./Event');
    const Video = require('./Video');

    return {
      class_passes: {
        relation: Model.HasManyRelation,
        modelClass: ClassPass,
        join: {
          from: 'user.id',
          to: 'class_pass.user',
        },
      },
      class_signups: {
        relation: Model.HasManyRelation,
        modelClass: ClassSignup,
        join: {
          from: 'user.id',
          to: 'class_signup.user',
        },
      },
      class_livestream_signups: {
        relation: Model.HasManyRelation,
        modelClass: ClassLivestreamSignup,
        join: {
          from: 'user.id',
          to: 'class_livestream_signup.user',
        },
      },
      class_waiting_list_signups: {
        relation: Model.HasManyRelation,
        modelClass: ClassWaitingListSignup,
        join: {
          from: 'user.id',
          to: 'class_waiting_list_signup.user',
        },
      },
      memberships: {
        relation: Model.HasManyRelation,
        modelClass: Membership,
        join: {
          from: 'user.id',
          to: 'membership.user',
        },
      },
      event_signups: {
        relation: Model.HasManyRelation,
        modelClass: EventSignup,
        join: {
          from: 'user.id',
          to: 'event_signup.user',
        },
      },
      image: {
        relation: Model.HasOneRelation,
        modelClass: Image,
        join: {
          from: 'user.image',
          to: 'image.id',
        },
      },
      orders: {
        relation: Model.HasManyRelation,
        modelClass: Order,
        join: {
          from: 'user.id',
          to: 'order.user',
        },
      },
      invoices: {
        relation: Model.HasManyRelation,
        modelClass: Order,
        join: {
          from: 'user.id',
          to: 'order.user'
        },
        filter: q => q.where('invoice_id','>',0).andWhere({archived: 0}),
      },
      teaching_classes: {
        relation: Model.ManyToManyRelation,
        modelClass: Class,
        join: {
          from: 'user.id',
          through: {
            from: 'class_teachers__user_teaching_classes.user_teaching_classes',
            to: 'class_teachers__user_teaching_classes.class_teachers',
          },
          to: 'class.id',
        },
      },
      teaching_events: {
        relation: Model.ManyToManyRelation,
        modelClass: Event,
        join: {
          from: 'user.id',
          through: {
            from: 'event_teachers__user_teaching_events.user_teaching_events',
            to: 'event_teachers__user_teaching_events.event_teachers',
          },
          to: 'event.id',
        },
      },
      teaching_videos: {
        relation: Model.ManyToManyRelation,
        modelClass: Video,
        join: {
          from: 'user.id',
          through: {
            from: 'video_teacher.user_id',
            to: 'video_teacher.video_id',
          },
          to: 'video.id',
        },
      },

    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['client', 'email'],
      properties: {
        createdAt: {
          type: 'integer',
          default: 0,
        },
        updatedAt: {
          type: 'integer',
          default: 0,
        },
        client: {
          type: 'integer',
        },
        email: {
          type: 'string',
        },
        email_confirmed: {
          type: 'integer',
          default: 0,
        },
        first_name: {
          type: 'string',
          default: '',
        },
        last_name: {
          type: 'string',
          default: '',
        },
        address_1: {
          type: 'string',
          default: '',
        },
        address_2: {
          type: 'string',
          default: '',
        },
        zip_code: {
          type: 'string',
          default: '',
        },
        city: {
          type: 'string',
          default: '',
        },
        country: {
          type: 'string',
          default: '',
        },
        phone: {
          type: 'string',
          default: '',
        },
        customer: {
          type: 'integer',
          default: 0,
        },
        admin: {
          type: 'integer',
          default: 0,
        },
        teacher: {
          type: 'integer',
          default: 0,
        },
        checkin: {
          type: 'integer',
          default: 0,
        },
        date_of_birth: {
          type: 'date',
          default: null,
        },
        teacher_description: {
          type: 'string',
          default: '',
        },
        customer_additional_info: {
          type: 'string',
          default: '',
        },

        encrypted_password: {
          type: 'string',
          default: '',
        },

        reset_password_token: {
          type: 'string',
          default: '',
        },

        reset_password_token_expires: {
          type: 'integer',
          default: 0,
        },

      },
    };
  }

  $formatJson(json) {

    json = super.$formatJson(json);

    json = _.omit(json, ['encrypted_password', 'reset_password_token', 'reset_password_token_expires', 'teacher_ical_token']);

    return json;
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.image !== 'undefined') {
      json.image_id = json.image;
      delete json.image;
    }

    if (typeof json.date_of_birth !== 'undefined' && json.date_of_birth !== null) {
      if (json.date_of_birth === '0000-00-00') {
        json.date_of_birth = '';
      } else {
        json.date_of_birth = moment(json.date_of_birth).format('YYYY-MM-DD');
      }
    }

    return json;
  }

}

module.exports = User;
