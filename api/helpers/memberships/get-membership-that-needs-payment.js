module.exports = {
    friendlyName: 'Get membership that needs payment',

    description: 'Performs an SQL query to get one membership that need payment (and only one)',

    inputs: {},

    exits: {
        success: {
            outputType: 'ref'
        }
    },

    fn: async (inputs, exits) => {

        const sql = require('../../sql/helpers/memberships/get-membership-that-needs-payment.sql');
        const membershipThatNeedsPaymentNow = (await sails.sendNativeQuery(sql)).rows[0];

        return exits.success(membershipThatNeedsPaymentNow);
    }

};
