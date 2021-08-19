const moment = require('moment');

module.exports = {

    friendlyName: 'Set automatic payment processing lock.',

    description: 'Starts by locking the membership. Then tests if it still needs auto payment. If it does, sets flag automatic_payment_processing_started.',

    inputs: {
        membership: {
            type: 'ref',
            description: 'The membership to process',
            required: true
        }
    },

    exits: {
        success: {
            outputType: 'boolean'
        },

        failLockAlreadySet: {
            description: 'The timestamp automatic_payment_processing_started is set.'
        },

        failMembershipIsPaidFor: {
            description: 'The membership is paid for at least until today.'
        },

        failMembershipArchived: {
            description: 'The membership has been archived.'
        },

        failStatusNotActiveOrCancelledRunning: {
            description: 'The membership status is not active and not cancelled_running.'
        },

        failMembershipCancelledAndExpired: {
            description: 'The membership has been cancelled and has expired.'
        },

        failRenewalFailed: {
            description: 'The payment has already been tried and failed.'
        },

        failNoPaymentSubscriptions: {
            description: 'The membership has no payment subscriptions.'
        }
    },

    fn: async (inputs, exits) => {

        const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);

        // Start transaction so we can reliably test if the membership needs to be paid
        const transactionResult = await sails.getDatastore().transaction(async (dbConnection, proceed) => {

            // Lock the membership record. Other connections are not allowed to go past this line then.
            let membershipThatNeedsPaymentNow = await sails.sendNativeQuery(
                "SELECT * FROM `membership` WHERE id = $1 FOR UPDATE",
                [membershipId]
            )
                .usingConnection(dbConnection);

            membershipThatNeedsPaymentNow = membershipThatNeedsPaymentNow.rows[0];

            // Now that we have a db lock, check that the membership was not paid in the meantime and that other criteria are also still valid
            if (membershipThatNeedsPaymentNow.automatic_payment_processing_started > 0) throw 'failLockAlreadySet';

            if (moment(membershipThatNeedsPaymentNow.paid_until, 'YYYY-MM-DD').isSameOrAfter(moment(), 'day')) throw 'failMembershipIsPaidFor';

            if (membershipThatNeedsPaymentNow.archived) throw 'failMembershipArchived';

            if (membershipThatNeedsPaymentNow.status !== 'active' && membershipThatNeedsPaymentNow.status !== 'cancelled_running') throw 'failStatusNotActiveOrCancelledRunning';

            if (
                membershipThatNeedsPaymentNow.status === 'cancelled_running' &&
                moment(membershipThatNeedsPaymentNow.cancelled_from_date, 'YYYY-MM-DD').isSameOrBefore(moment(), 'day')
            ) throw 'failMembershipCancelledAndExpired';

            if (membershipThatNeedsPaymentNow.renewal_failed) throw 'failRenewalFailed';

            // See if there is still an active subscription
            let subscriptions = await PaymentSubscription.find({
                membership: membershipId,
                status: 'active',
                archived: false
            }).usingConnection(dbConnection);
            if (!subscriptions.length) throw 'failNoPaymentSubscriptions';

            // Everything looks good. Set flag on membership so other processes won't try to fetch the same payment
            await Membership.update({
                id: membershipThatNeedsPaymentNow.id
            }, {
                automatic_payment_processing_started: new Date()
            }).usingConnection(dbConnection);


            return proceed(null, true)

        });

        return exits.success(transactionResult);

    }
};
