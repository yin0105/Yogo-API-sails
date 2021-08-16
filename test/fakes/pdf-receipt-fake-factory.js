const sinon = require('sinon');

module.exports = {
  installPdfReceiptFake(filename) {
    filename = filename || 'test-receipt.pdf';
    const pdfReceiptFake = sinon.fake.returns({filename: filename, pdfBuffer: Buffer.from('Test')})
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake)
    pdfReceiptFake.with = pdfReceiptFake;
    return pdfReceiptFake;
  },
};
