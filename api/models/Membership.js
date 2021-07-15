/**
 * .js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment')

module.exports = {

  attributes: {

    client: {
      model: 'Client',
    },

    user: {
      model: 'User',
    },

    membership_type: {
      model: 'MembershipType',
    },

    status: {
      type: 'string',
      isIn: ['active', 'ended', 'cancelled_running'],
    },

    ended_because: {
      type: 'string',
      isIn: ['cancelled', 'payment_failed', 'no_payment_method', 'admin_action'],
      allowNull: true,
    },

    renewal_failed: {
      type: 'number',
      defaultsTo: 0,
    },

    renewal_failed_last_time_at: {
      type: 'number',
      defaultsTo: 0,
    },

    paid_until: {
      type: 'ref',
      columnType: 'date',
    },

    start_date: {
      type: 'ref',
      columnType: 'date',
    },

    cancelled_from_date: {
      type: 'ref',
      columnType: 'date',
    },

    payment_subscriptions: {
      collection: 'PaymentSubscription',
      via: 'membership',
    },

    orders: {
      collection: 'Order',
      via: 'membership',
    },

    payment_option: {
      model: 'MembershipTypePaymentOption',
    },

    real_user_is_someone_else: 'boolean',
    real_user_name: 'string',
    real_user_image: {
      model: 'Image',
    },

    early_warning_for_missing_subscription_sent: 'boolean',
    warning_for_missing_subscription_on_payment_due_sent: 'boolean',

    automatic_payment_processing_started: {
      type: 'number',
      defaultsTo: 0,
    },

    log_entries: {
      collection: 'MembershipLog',
      via: 'membership',
    },

    membership_campaign: {
      model: 'MembershipCampaign'
    },
    membership_campaign_number_of_reduced_payments_left: {
      type: 'number',
      defaultsTo: 0
    },

    discount_code: {
      model: 'DiscountCode'
    },

    ad_hoc_task_status: 'string',

    membership_pauses: {
      collection: 'MembershipPause',
      via: 'membership_id',
    },

  },

  customToJSON() {
    this.start_date = moment(this.start_date).format('YYYY-MM-DD')
    this.paid_until = moment(this.paid_until).format('YYYY-MM-DD')
    this.cancelled_from_date = this.cancelled_from_date ? moment(this.cancelled_from_date).format('YYYY-MM-DD') : this.cancelled_from_date

    return this
  },

}

