const axios = require('axios').default;

const ClassPassApi = axios.create({
  baseURL: 'https://sandbox-api.classpass.com/cp/v1',
  // ClassPass Sandbox URL
  // https://sandbox-api.classpass.com

  // ClassPass Token
  // nHB8wffXiFZ4jxaohDwH
});

ClassPassApi.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    config.headers.access_token = sails.config.integrations.classpass_com.classpass_com_access_token;
    return config;
  },
);

ClassPassApi.interceptors.response.use(
  function (response) {
    // console.log('Axios response intercepted: ', response);
    return response.data.data;
  },
  (error) => {
    // console.log('Intercepted error:', error, error.response ? error.response.data : null);
    console.log('error.response.data.error:', error.response && error.response.data ? error.response.data.error : null)
  }
)

module.exports = ClassPassApi;
