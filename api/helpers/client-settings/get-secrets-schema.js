module.exports = {

  friendlyName: 'Get client settings schema for secret (server-only) parameters',

  sync: true,

  fn: (inputs, exits) => {

    return exits.success({

      payment_service_provider_reepay_private_api_key: {
        type: 'string',
        defaultsTo: ''
      },

      payment_service_provider_reepay_webhook_secret: {
        type: 'string',
        defaultsTo: ''
      },

      vimeo_oauth_access_token: {
        type: 'string',
        defaultsTo: ''
      },

      vimeo_oauth_csrf_state: {
        type: 'string',
        defaultsTo: ''
      },
      plan: {  
        type: 'string', 
        defaultsTo: '',  
        isIn: ['','studio','studio_light','studio_app','pay_as_you_grow']
      },
      plan_pay_as_you_grow_yogo_percentage: { 
        type: 'number', 
        defaultsTo: 5
      },
      payment_service_provider_stripe_account_id: { 
        type: 'string', 
        defaultsTo: ''
      }

    })

  },
}
