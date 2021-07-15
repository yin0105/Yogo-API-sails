const fixturesFactory = require('./fixtures/factory');
const sails = require('sails');

// Before running any tests...
before(function (done) {

  //console.log('before running tests');

  // Increase the Mocha timeout so that Sails has enough time to lift, even if you have a bunch of assets.
  this.timeout(40000);

  sails.lift(
    {
      // Your sails app's configuration files will be loaded automatically,
      // but you can also specify any other special overrides here for testing purposes.

      // For example, we might want to skip the Grunt hook,
      // and disable all logs except errors and warnings:
      hooks: {grunt: false},
      //log: {level: 'warn'},
      datastores: {
        default: {
          adapter: 'sails-mysql',
          // DON'T USE ON A DB WITH IMPORTANT DATA!! TABLES ARE TRUNCATED WHEN THE TESTS FINISHES!!
          url: 'mysql://yogo_test:yogo_test@127.0.0.1/yogo_test',
          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_520_ci',
        },
      },
      email: {
        sendRealEmails: true,
        // They will not be sent for real, since getTransport should be stubbed.
        // As failsafe, Mailgun staging domain can only send to a few specific addresses.
        // Production credentials are only available in the production environment.
      },

    },
    async function (err) {
      if (err) {
        return done(err);
      }

      await fixturesFactory.teardown();
      await fixturesFactory.build();

      return done();

    },
  );

});

beforeEach(async () => {

});

afterEach(async () => {

});

// After all tests have finished...
after(async function () {

  //console.log('after');

  // here you can clear fixtures, etc.
  // (e.g. you might want to destroy the records you created above)

  await fixturesFactory.teardown();

  await new Promise((resolve, reject) => {

    sails.lower((err) => {
      if (err) reject(err);
      resolve();
    });

  });

});
