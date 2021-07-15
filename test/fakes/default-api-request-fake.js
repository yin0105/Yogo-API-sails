const sinon = require('sinon')

module.exports = {

  replace: (options) => {
    options = options || {}
    options.status = options.status || 'ACCEPTED'

    const responseData = options.status === 'ACCEPTED' ?
      {
        status: 'ACCEPTED',
        cardtype: 'V-DK',
        fee: 0,
        approvalcode: 39,
        transact: '123456',
      } :
      {
        status: 'DECLINED',
        reason: 'Test reason',
      }


    const apiRequestFake = sinon.fake.returns(responseData)

    sinon.replace(sails.helpers.paymentProvider.dibs, 'apiRequest', apiRequestFake)

    return apiRequestFake
  },

  restore: () => {
    sails.helpers.paymentProvider.dibs.apiRequest.restore()
  }
}
