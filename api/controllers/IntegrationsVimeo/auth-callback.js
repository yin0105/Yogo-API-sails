module.exports = {
  friendlyName: 'Get Vimeo integration status',

  inputs: {
    code: {
      type: 'string',
      required: true,
    },
    state: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    invalidOauthCsrfState: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const clientId = inputs.state.split('_')[0]
    const oauthCsrfState = inputs.state.split('_')[1]
    const returnToAdminPage = inputs.state.split('_')[2]
    const storedOauthCsrfState = await sails.helpers.clientSettings.find(clientId, 'vimeo_oauth_csrf_state', true)

    if (oauthCsrfState !== storedOauthCsrfState) {
      return exits.invalidOauthCsrfState('E_INVALID_OAUTH_CSRF_STATE')
    }

    const code = inputs.code

    const codeResponse = await sails.helpers.integrations.vimeo.api.request.with({
      method: 'POST',
      endpoint: '/oauth/access_token',
      body: {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": (sails.config.externalRedirectUrl || sails.config.baseUrl) + '/integrations/vimeo/auth/callback',
      },
    })

    await sails.helpers.clientSettings.update(clientId, {
      vimeo_oauth_access_token: codeResponse.access_token,
    })

    await sails.helpers.clientSettings.update(clientId, {
      vimeo_update_video_list_needed: true,
    })

    this.res.redirect(returnToAdminPage)

    return exits.success()

  },
}
