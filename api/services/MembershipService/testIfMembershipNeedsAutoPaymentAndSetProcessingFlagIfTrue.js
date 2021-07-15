/**
 * autoRenewMembership.js
 *
 * @param options
 * @returns {Promise<boolean>}
 */

const moment = require('moment');

module.exports = async (options) => {

    const membershipId = options.membershipId;

    // Start transaction so we can reliably test if the membership needs to be paid
    return await sails.getDatastore().transaction(async (dbConnection, proceed) => {

        // Lock the membership record. Other connections are (I think) not allowed to go past this line then.
        let membershipThatNeedsPaymentNow = await sails.sendNativeQuery("SELECT * FROM `membership` WHERE id = $1 FOR UPDATE", [membershipId])
            .usingConnection(dbConnection);

        membershipThatNeedsPaymentNow = membershipThatNeedsPaymentNow.rows[0];

        // Now that we have a db lock, check that the membership was not paid in the meantime and that other criteria are also still valid
        if (membershipThatNeedsPaymentNow.automatic_payment_processing_started > 0) return proceed(null, false);
        if (moment(membershipThatNeedsPaymentNow.paid_until, 'YYYY-MM-DD').isSameOrAfter(moment(), 'day')) return proceed(null, false);
        if (membershipThatNeedsPaymentNow.archived) return proceed(null, false);
        if (membershipThatNeedsPaymentNow.status !== 'active' && membershipThatNeedsPaymentNow.status !== 'cancelled_running') return proceed(null, false);
        if (
            membershipThatNeedsPaymentNow.status === 'cancelled_running' &&
            moment(membershipThatNeedsPaymentNow.cancelled_from_date, 'YYYY-MM-DD').isSameOrBefore(moment(), 'day')
        ) return proceed(null, false);
        if (membershipThatNeedsPaymentNow.renewal_failed) return proceed(null, false);

        // See if there is still an active subscription
        let subscriptions = await PaymentSubscription.find({
            membership: membershipId,
            status: 'active',
            archived: false
        }).usingConnection(dbConnection);
        if (!subscriptions.length) return proceed(null, false);

        // Everything looks good. Set flag on membership so other processes won't try to fetch the same payment
        await Membership.update({
            id: membershipThatNeedsPaymentNow.id
        }, {
            automatic_payment_processing_started: new Date()
        }).usingConnection(dbConnection);


        return proceed(null, true)

    });

};
