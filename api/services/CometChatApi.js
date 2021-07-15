const axios = require('axios').default;

const CometChatApi = axios.create({
  baseURL: 'https://api-us.cometchat.io/v2.0',
});

CometChatApi.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    config.headers.apiKey = sails.config.integrations.cometChat.apiKey;
    config.headers.appId = sails.config.integrations.cometChat.appId;
    return config;
  },
);

CometChatApi.interceptors.response.use(
  function (response) {
    // console.log('Axios response intercepted: ', response);
    return response.data.data;
  },
  (error) => {
    console.log('Intercepted error:', error, error.response ? error.response.data : null);
    console.log('error.response.data.error:', error.response && error.response.data ? error.response.data.error : null)
  }
)

module.exports = CometChatApi;
