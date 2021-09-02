const axios = require('axios').default;
// const querystring = require('querystring');

module.exports = {
    friendlyName: 'Stripe Onboarding',
  
    inputs: {
        accountId: {
            type: 'string',
            required: false,
        },
    },
  
    exits: {
        forbidden: {
            responseType: 'forbidden',
        },
        onboardingFailed: {
            responseType: 'badRequest',
        },
    },
  
    fn: async function (inputs, exits) {
        console.log("inputs = ", inputs)
        if (!await sails.helpers.can2('controller.StripePayments.onboardingCheck', this.req)) {
            return exits.forbidden()
        }

        const secretKey = sails.config.paymentProviders.stripe.secretKey

        const headers = {
            'Authorization': `Bearer ${secretKey}`
        }

        // Check account
        let res = await axios.get(`https://api.stripe.com/v1/accounts/${inputs.accountId}`, {
            headers: headers
        })

        console.log("== check ==")
        console.log("res = ", res)

        if (!res || !res.data || !res.data.details_submitted) {
            return exits.success(false);
        }

        console.log("res.data.details_submitted = ", res.data.details_submitted)

        return exits.success(res.data.details_submitted);  
    },
  }
  