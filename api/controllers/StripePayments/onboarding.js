const axios = require('axios').default;
// const querystring = require('querystring');

module.exports = {
    friendlyName: 'Stripe Onboarding',
  
    inputs: {
        host: {
            type: 'string',
            required: true
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
        if (!await sails.helpers.can2('controller.StripePayments.onboarding', this.req)) {
            return exits.forbidden()
        }

        const secretKey = sails.config.paymentProviders.stripe.secretKey
        console.log("secret key = ", secretKey)
        console.log("host = ", inputs.host)

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${secretKey}`
        }

        let params = new URLSearchParams();
        params.append('type', 'standard');

        // Create account
        let res = await axios.post('https://api.stripe.com/v1/accounts', params, {
            headers: headers
        })

        if (!res || !res.data || !res.data.id) {
            return exits.onboardingFailed('Stripe onboarding is failed.');
        }

        // return exits.onboardingFailed('Stripe onboarding is failed.');
        const accountId = res.data.id;
        
        // Create account link
        params = new URLSearchParams();
        params.append('type', 'account_onboarding');
        params.append('account', accountId);
        params.append('return_url', `${inputs.host}/admin/#/stripe-onboarding-return`);
        params.append('refresh_url', `${inputs.host}/admin/#/stripe-onboarding-refresh`);
        res = await axios.post('https://api.stripe.com/v1/account_links', params, {
            headers: headers
        })

        const redirectURL = res.data.url;

        console.log("res = ", res)
        console.log("redirectURL = ", redirectURL)
        console.log("account_id = ", accountId)
  
        return exits.success({account_id: accountId, url: redirectURL})
  
    },
  }
  