/**
 * DibsPaymentService.js
 */

module.exports = {

    async fetchMembershipRenewalPayment(options) {
        const func = require('./DibsPaymentService/fetchMembershipRenewalPayment');
        return await func(options)
    },

    async ticketAuth(options) {
        const func = require('./DibsPaymentService/ticketAuth');
        return await func(options)
    }

};
