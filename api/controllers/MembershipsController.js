/**
 * MembershipsController
 *
 * @description :: Server-side logic for managing memberships
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const moment = require('moment')
require('require-sql')
const NoShowFeeObj = require('../objection-models/NoShowFee');

module.exports = {


    async findOne(req, res) {



            let populateFields = req.query.populate
                ?
                _.keyBy(_.intersection(req.query.populate, [
                    'payment_option',
                    'membership_type',
                    'membership_type.class_types',
                    'membership_type.payment_options',
                    'payment_subscriptions',
                    'payment_subscriptions.payment_subscription_transactions',
                    'orders',
                    'log_entries',
                    'user',
                    'membership_campaign',
                    'next_payment',
                    'discount_code',
                    'pending_no_show_fees',
                    'pending_no_show_fees.class',
                    'pending_no_show_fees.class.class_type',
                    'pending_no_show_fees.class_signup',
                    'no_show_fees',
                    'no_show_fees.class',
                    'no_show_fees.class.class_type',
                    'no_show_fees.class_signup',
                ]))
                :
                {}

            let membershipQuery = Membership.findOne(req.param('id'));

            if (populateFields.payment_option) membershipQuery.populate('payment_option');
            if (populateFields.orders) membershipQuery.populate('orders', {invoice_id: {'>': 0}});
            if (populateFields.payment_subscriptions) membershipQuery.populate('payment_subscriptions');
            if (populateFields.log_entries) membershipQuery.populate('log_entries', {sort: 'createdAt DESC'});
            if (populateFields.user) membershipQuery.populate('user');
            if (populateFields.real_user_image) membershipQuery.populate('real_user_image');
            if (populateFields.membership_campaign) membershipQuery.populate('membership_campaign');
            if (populateFields.discount_code) membershipQuery.populate('discount_code');


            const membership = await membershipQuery;

            if (populateFields.no_show_fees) {
              const feesQuery = NoShowFeeObj.query().where({
                membership_id: req.param('id'),
                archived: 0,
              });
              if (populateFields['no_show_fees.class'] || populateFields['no_show_fees.class_signup']) {
                const eagerObj = {
                  class: !!populateFields['no_show_fees.class'],
                  class_signup: !!populateFields['no_show_fees.class_signup'],
                };
                if (populateFields['no_show_fees.class'] && populateFields['no_show_fees.class.class_type']) {
                  eagerObj.class = {class_type: true};
                }
                feesQuery.eager(eagerObj);
              }
              membership.no_show_fees = await feesQuery;
            }

            if (populateFields.pending_no_show_fees) {
              const pendingFeesQuery = NoShowFeeObj.query().where({
                membership_id: req.param('id'),
                archived: 0,
                cancelled_at:0,
                paid_with_order_id: null
              });
              if (populateFields['pending_no_show_fees.class'] || populateFields['pending_no_show_fees.class_signup']) {
                const eagerObj = {
                  class: !!populateFields['pending_no_show_fees.class'],
                  class_signup: !!populateFields['pending_no_show_fees.class_signup'],
                };
                if (populateFields['pending_no_show_fees.class'] && populateFields['pending_no_show_fees.class.class_type']) {
                  eagerObj.class = {class_type: true};
                }
                pendingFeesQuery.eager(eagerObj);
              }
              membership.pending_no_show_fees = await pendingFeesQuery;
            }


            if (populateFields.membership_type) {

                let membershipTypeQuery = MembershipType.findOne(membership.membership_type)

                if (populateFields['membership_type.class_types']) membershipTypeQuery.populate('class_types')
                if (populateFields['membership_type.payment_options']) membershipTypeQuery.populate('payment_options')


                membership.membership_type = await membershipTypeQuery
            }

            if (populateFields.payment_subscriptions) {

                let paymentSubscriptionQuery = PaymentSubscription.find({membership: membership.id, archived: false})

                if (populateFields['payment_subscriptions.payment_subscription_transactions']) paymentSubscriptionQuery.populate('payment_subscription_transactions')

                membership.payment_subscriptions = await paymentSubscriptionQuery

            }

            if (populateFields.next_payment) {
              await sails.helpers.populate.memberships.nextPayment([membership])
            }


            return res.json(membership);


    },


    async create(req, res) {
        const membershipData = _.pick(req.body, [
            'user',
            'membership_type',
            'paid_until',
            'payment_option',
            'real_user_is_someone_else',
            'real_user_name',
            'real_user_image'
        ]);
        const user = await User.findOne(membershipData.user);
        if (user.client !== req.client.id) {
            return res.badRequest('User belongs to a different client.')
        }
        const membershipType = await MembershipType.findOne(membershipData.membership_type);
        if (membershipType.client !== req.client.id) {
            return res.badRequest('Membership type belongs to a different client.')
        }
        const paymentOption = await MembershipTypePaymentOption.findOne(membershipData.payment_option);
        if (paymentOption.client !== req.client.id) {
            return res.badRequest('PaymentOption belongs to a different client.')
        }
        const membership = await MembershipType.applyToCustomer(
            membershipData.membership_type,
            membershipData.payment_option,
            membershipData.user,
            null,
            moment(membershipData.paid_until),
            membershipData.real_user_is_someone_else,
            membershipData.real_user_name,
            membershipData.real_user_image
        );

        const entry = 'Medlemskab "' + membershipType.name + '" oprettet manuelt i admin. ' +
            'Betalingsperiode: ' + paymentOption.number_of_months_payment_covers + ' måned' + (paymentOption.number_of_months_payment_covers > 1 ? 'er' : '') + '. ' +
            'Betalt-til-dato: ' + moment(membershipData.paid_until).format('D. MMMM YYYY') + '. ' +
            (
                membershipData.real_user_is_someone_else ? ' Bruger af medlemskabet: ' + membershipData.real_user_name + '.' +
                    (membershipData.real_user_image ? ' [image-' + membershipData.real_user_image + ']' : '')
                    : ''
            ) +
            'Oprettet af ' + req.user.first_name + ' ' + req.user.last_name + '.';

        await MembershipLog.log(
            membership,
            entry
        );

        return res.ok(membership);
    },


    async destroy(req, res) {

        // Cancel all signups for classes that have not started yet.
        // Since this function is not availble from frontend, we don't have to worry about sign-off deadline.

        const membershipId = req.param('id');
        const now = moment();

        const cancelSignupsSql = require('../sql/MembershipsControllerSql/cancelSignupsForMembershipFromMomentForward.sql');

        await sails.sendNativeQuery(cancelSignupsSql, [
            membershipId,
            now.format('YYYY-MM-DD'),
            now.format('HH:mm:ss')
        ]);

        await Membership.update({
            id: req.param('id')
        }, {
            archived: true
        });

        await MembershipLog.log(
            membershipId,
            'Medlemskab stoppet fra admin med øjeblikkelig virkning. Admin-bruger: ' + req.user.first_name + ' ' + req.user.last_name
        );

        return res.ok();

    },

    async retryFailedSubscriptionPayment(req, res) {

      const membership = await Membership.findOne(req.param('id'))

      await sails.helpers.cron.log('Retry failed subscription payment for membership ' + membership.id)

      await Membership.update(
        {id: membership.id},
        {
          renewal_failed: Math.max(membership.renewal_failed - 1, 0),
          renewal_failed_last_time_at: 0
        }
      )

      const paymentAccepted = await sails.helpers.memberships.lockVerifyAndProcessMembership(
        membership,
        sails.helpers.memberships.membershipPaymentShouldStillBeProcessed,
        sails.helpers.memberships.fetchMembershipPayment
      )
        .tolerate('membershipDoesNotNeedPayment', () => {
          res.ok('E_MEMBERSHIP_DOES_NOT_NEED_PAYMENT')
          return null
        })

      if (paymentAccepted) {
        return res.ok()
      } else if (paymentAccepted === false) {
        return res.ok('E_PAYMENT_FAILED')
      }


    }

}
;
