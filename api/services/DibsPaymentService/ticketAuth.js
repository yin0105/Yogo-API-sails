const request = require('request-promise-native');
const querystring = require('querystring');

module.exports = async options => {

    const requestForm = {
        merchant: options.merchant,
        ticket: options.ticket,
        amount: options.amount * 100,
        currency: '208',
        orderid: options.orderid,
        textreply: 'true',
        test: !sails.config.productionPayments,
        capturenow: 'yes'
        // TODO: MD5 key
    };

    const ticketAuthUrl = sails.config.productionPayments ?
        'https://payment.architrade.com/cgi-ssl/ticket_auth.cgi' :
        'http://localhost:1338/ticket-auth'
    ;


    return await request.post(ticketAuthUrl, {
        form: requestForm
    });

};
