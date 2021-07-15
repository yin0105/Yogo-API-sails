const sinon = require('sinon');

let
  gatewayFake,
  tolerateFake;

module.exports = {

  createFake: () => {
    tolerateFake = sinon.fake.returns({
      ids: ['sms_test_id'],
      usage: {
        total_cost: 0.33,
        currency: 'DKK',
      },
    });

    gatewayFake = sinon.fake.returns({
      tolerate: tolerateFake,
    });

    gatewayFake.with = gatewayFake

    sinon.replace(sails.helpers.sms.transport, 'gatewayApi', gatewayFake);
    return gatewayFake;
  },

  createErrorFake: () => {
    tolerateFake = sinon.fake((errorCode, tolerateHandler) => {
      return tolerateHandler('Error text')
    });

    gatewayFake = sinon.fake.returns({
      tolerate: tolerateFake,
    });

    gatewayFake.with = gatewayFake

    sinon.replace(sails.helpers.sms.transport, 'gatewayApi', gatewayFake);
    return gatewayFake;
  }

};

