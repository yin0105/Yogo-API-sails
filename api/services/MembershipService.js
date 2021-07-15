/**
 * MembershipService
 *
 * @description :: Handles business logic relating to memberships. All logic is in the sub folder. This file is ONLY the Service layer
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    async testIfMembershipNeedsAutoPaymentAndSetFlagIfTrue(options) {
        const func = require('./MembershipService/testIfMembershipNeedsAutoPaymentAndSetProcessingFlagIfTrue');
        return await func(options);
    },

    async stopCancelledAndExpiredMembership() {
        const func = require('./MembershipService/stopCancelledAndExpiredMembership');
        return await func();
    },

    async stopMembershipWithNoPaymentMethodAndExpired() {
        const func = require('./MembershipService/stopMembershipWithNoPaymentMethodAndExpired');
        return await func(options);
    },

    async stopMembershipWithPaymentFailedAndExpired() {
        // TODO: Remove signups when stopping membership
        const func = require('./MembershipService/stopMembershipWithPaymentFailedAndExpired');
        return await func(options);
    }

};
