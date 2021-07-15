module.exports = {

    friendlyName: 'Auto-renew one membership.',

    description: 'Checks if there is a membership that needs renewal and processes it. Returns true if a membership was processed, false otherwise.',

    inputs: {},

    exits: {
        success: {
            outputType: 'boolean'
        }
    },

    fn: async (inputs, exits) => {

        await sails.helpers.cron.log(
            'About to look for memberships that need payment'
        );

        const membershipThatNeedsPaymentNow = await sails.helpers.memberships.getMembershipThatNeedsPayment();


        if (!membershipThatNeedsPaymentNow) {
            await sails.helpers.cron.log(
                'Found no memberships that need payment'
            );
            return exits.success(false);
        }

        await sails.helpers.cron.log(
            'Found membership that needs payment now. About to set processing lock on membership: ' + membershipThatNeedsPaymentNow.id,
            membershipThatNeedsPaymentNow.client
        );

        // Use transaction to lock the membership and test if the membership still needs to be paid.
        const doFetchPayment = await sails.helpers.memberships.setAutoPaymentProcessingLock(membershipThatNeedsPaymentNow.id)

            .tolerate(async (err) => {
                if (err.code.substr(0,4) === 'fail') {
                    await sails.helpers.cron.log(
                        err.code + ' on membership: ' + membershipThatNeedsPaymentNow.id,
                        membershipThatNeedsPaymentNow.client
                    );
                    return false;
                } else {
                    throw err;
                }
            });


        if (!doFetchPayment) {
            await sails.helpers.cron.log(
                'Could NOT set processing lock on membership: ' + membershipThatNeedsPaymentNow.id,
                membershipThatNeedsPaymentNow.client
            );
            return exits.success(false);
        }

        await sails.helpers.cron.log(
            'Lock set. About to process renewal of membership: ' + membershipThatNeedsPaymentNow.id,
            membershipThatNeedsPaymentNow.client
        );


        // Fetch the payment.
        await DibsPaymentService.fetchMembershipRenewalPayment({membershipId: membershipThatNeedsPaymentNow.id});

        // If we are here, everything went ok, and we should unlock the membership for future automatic payments
        await sails.helpers.cron.log(
            'Auto payment seems to have went ok. About to unlock membership: ' + membershipThatNeedsPaymentNow.id,
            membershipThatNeedsPaymentNow.client
        );

        await Membership.update({
            id: membershipThatNeedsPaymentNow.id
        }, {
            automatic_payment_processing_started: 0
        });

        await sails.helpers.cron.log(
            'Unlocked membership: ' + membershipThatNeedsPaymentNow.id,
            membershipThatNeedsPaymentNow.client
        );

        return exits.success(membershipThatNeedsPaymentNow.id);

    }

};
