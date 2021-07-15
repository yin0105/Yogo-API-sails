const sinon = require('sinon');

module.exports = {
  installPdfReceiptFake(filename) {
    filename = filename || 'test-receipt.pdf';
    const pdfReceiptFake = sinon.fake.returns({filename: filename, pdfBuffer: new Buffer('Test')})
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake)
    pdfReceiptFake.with = pdfReceiptFake;
    return pdfReceiptFake;
  },
};
