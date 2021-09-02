const jwToken = require('../../services/jwTokens.js');
const {v4: uuidv4} = require('uuid');

module.exports = {

    friendlyName: 'Confirm user',

    inputs: {
        id: {
            type: 'number',
            required: true,
        },
    },

    exits: {
        success: {
            description: "Email address confirmed.",
        },
        error: {
            statusCode: 400,
            description: 'Something went wrong',
        },
    },

    fn: async function (inputs, exits) {
        if (!await sails.helpers.can2('controller.ReepayPayments.send-onboarding-email', this.req)) {
            return exits.forbidden()
        }

        const clientId = this.req.client.id ? this.req.client.id: inputs.id;
        const client = await Client.findOne({id: clientId});
        let messageParams = {};

        // send YOGO email to kontakt@yogo.dk
        messageParams.to = "kontakt@yogo.dk";
        messageParams.subject = `Please start Reepay onboarding for ${client.name}, ID ${client.id}`;        
        messageParams.html = "<p>" + `Please start Reepay onboarding for ${client.name}, ID ${client.id}` + "</p>" 
        
        logger.info('Sending "Reepay Onboarding" email with subject ' + messageParams.subject + ' to ' + messageParams.to);
        console.log("email: ", messageParams)

        await sails.helpers.email.send.with({
            non_user_email: messageParams.to,
            subject: messageParams.subject,
            html: messageParams.html,
            emailType: 'reepay_onboarding_email',
        });

        return exits.success({data: 'ok'})

    },

};
