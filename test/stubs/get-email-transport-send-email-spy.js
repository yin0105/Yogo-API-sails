const sinon = require('sinon')

let transportStub,
  sendMailStub


module.exports = {

  createStub: () => {
    sendMailStub = sinon.stub().callsFake(function(options, callback) {
      callback(null, {})
    })

    transportStub = sinon.stub(sails.helpers.email, 'getTransport').callsFake(function() {
      return {
        sendMail: sendMailStub,
      }
    })
    return sendMailStub
  },

  destroy: () => {
    transportStub.restore()
  },

}

