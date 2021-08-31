const axios = require('axios').default;
// const querystring = require('querystring');

module.exports = {
    friendlyName: 'Stripe Onboarding',
  
    inputs: {
  
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
        if (!await sails.helpers.can2('controller.StripePayments.onboarding', this.req)) {
            return exits.forbidden()
        }

        const secretKey = sails.config.paymentProviders.stripe.secretKey
        console.log("secret key = ", secretKey)

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${secretKey}`
        }

        let accountId;
        const params = new URLSearchParams();
        params.append('type', 'standard');
        // let data = querystring.stringify({type: 'standard'})
        // const res = await axios.get('https://api.stripe.com/v1/accounts/acct_1JUXmvPYjWzBI4DI', {
        //     headers: headers
        // })

        let res = await axios.post('https://api.stripe.com/v1/accounts', params, {
            headers: headers
        })

        if (!res || !res.data || !res.data.id) {
            return exits.onboardingFailed('Stripe onboarding is failed.');
        }
        
        const accountId = res.data.id;




        console.log("res = ", res)
        // .then((response) => {
        //     console.log("response = ", response);
        //     accountId = response.id;
        //     console.log("accountId = ", accountId);
        //     // dispatch({
        //     //     type: FOUND_USER,
        //     //     data: response.data[0]
        //     // })
        // })
        // .catch((error) => {
        //     return exits.onboardingFailed('Stripe onboarding is failed.');
        //     // dispatch({
        //     //     type: ERROR_FINDING_USER
        //     // })
        // })

        // let result = await axios.get(`${sails.config.imgixServer}/${clients[0].uri}?fm=json`)
  
    //   const order = await sails.helpers.order.createFromCart.with({
    //     user: this.req.user.id,
    //   })
    //     .tolerate('paymentOptionGoneAway', () => {
    //       return 'VALIDATION_ERROR'
    //     })
    //     .tolerate('userIsNotEligibleForCampaign', () => {
    //       return 'VALIDATION_ERROR'
    //     })
  
    //   if (order === 'VALIDATION_ERROR') {
    //     exits.success('E_INVALID_CART_ITEM')
    //   }
  
    //   const chargeSession = await sails.helpers.paymentProvider.reepay.createChargeSession.with({
    //     order: order
    //   })
  
        return exits.success(accountId)
  
    },
  }
  