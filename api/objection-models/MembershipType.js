const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class MembershipType extends Model {

  static get tableName() {
    return 'membership_type'
  }

  static get relationMappings() {
    const ClassType = require('./ClassType')
    const VideoGroup = require('./VideoGroup')
    const MembershipTypePaymentOption = require('./MembershipTypePaymentOption')
    const PriceGroup = require('./PriceGroup')
    const Membership = require('./Membership')
    const MembershipCampaign = require('./MembershipCampaign')
    const Image = require('./Image')

    return {
      class_types: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassType,
        join: {
          from: 'membership_type.id',
          through: {
            from: 'classtype_membership_types__membershiptype_class_types.membershiptype_class_types',
            to: 'classtype_membership_types__membershiptype_class_types.classtype_membership_types',
          },
          to: 'class_type.id',
        },
      },
      class_types_livestream: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassType,
        join: {
          from: 'membership_type.id',
          through: {
            from: 'membership_type_class_type_livestream.membership_type',
            to: 'membership_type_class_type_livestream.class_type',
          },
          to: 'class_type.id',
        },
      },
      video_groups: {
        relation: Model.ManyToManyRelation,
        modelClass: VideoGroup,
        join: {
          from: 'membership_type.id',
          through: {
            from: 'membershiptype_video_groups__videogroup_membership_types.membershiptype_video_groups',
            to: 'membershiptype_video_groups__videogroup_membership_types.videogroup_membership_types',
          },
          to: 'video_group.id',
        },
      },
      payment_options: {
        relation: Model.HasManyRelation,
        modelClass: MembershipTypePaymentOption,
        join: {
          from: 'membership_type.id',
          to: 'membership_type_payment_option.membership_type',
        },
      },
      price_groups: {
        relation: Model.ManyToManyRelation,
        modelClass: PriceGroup,
        join: {
          from: 'membership_type.id',
          through: {
            from: 'membershiptype_price_groups__pricegroup_membership_types.membershiptype_price_groups',
            to: 'membershiptype_price_groups__pricegroup_membership_types.pricegroup_membership_types',
          },
          to: 'price_group.id',
        },
      },
      memberships: {
        relation: Model.HasManyRelation,
        modelClass: Membership,
        join: {
          from: 'membership_type.id',
          to: 'membership.membership_type'
        }
      },
      active_campaign: {
        relation: Model.HasOneRelation,
        modelClass: MembershipCampaign,
        join: {
          from: 'membership_type.active_campaign',
          to: 'membership_campaign.id'
        }
      },
      image: {
        relation: Model.HasOneRelation,
        modelClass: Image,
        join: {
          from: 'membership_type.image',
          to: 'image.id'
        }
      }

    }

  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json)

    if (typeof json.active_campaign !== 'undefined') {
      json.active_campaign_id = json.active_campaign
      delete json.active_campaign
    }

    // Boolean are stored as Tinyint, but apps need Boolean
    if (typeof json.has_max_number_of_classes_per_week !== 'undefined') {
      json.has_max_number_of_classes_per_week = !!json.has_max_number_of_classes_per_week
    }

    if (typeof json.has_max_number_of_simultaneous_bookings !== 'undefined') {
      json.has_max_number_of_simultaneous_bookings = !!json.has_max_number_of_simultaneous_bookings
    }

    if (typeof json.has_max_number_of_memberships !== 'undefined') {
      json.has_max_number_of_memberships = !!json.has_max_number_of_memberships
    }

    if (typeof json.send_email_to_customer !== 'undefined') {
      json.send_email_to_customer = !!json.send_email_to_customer
    }

    if (typeof json.access_all_videos !== 'undefined') {
      json.access_all_videos = !!json.access_all_videos
    }

    if (typeof json.image !== 'undefined') {
      json.image_id = json.image
      delete json.image
    }

    return json
  }

}

module.exports = MembershipType
