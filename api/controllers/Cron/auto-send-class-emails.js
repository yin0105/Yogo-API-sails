module.exports = {
  friendlyName: 'Auto-send class emails',

  fn: async function (inputs, exits) {

    const logger = sails.helpers.logger('class-emails')

    logger.info('Starting auto-send-class-emails.js')

    await sails.helpers.classEmail.sendPendingInitialBatches();

    await sails.helpers.classEmail.sendToSubsequentSignups();

    logger.info('Done with auto-send-class-emails.js')

    return exits.success();

  },

};
