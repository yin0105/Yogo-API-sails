const assert = require('assert');
const assertAsyncThrows = require('../../utils/assert-async-throws');
const mockRequire = require('mock-require');
const path = require('path');

describe('can (Access control)', async () => {

  afterEach(() => {
    mockRequire.stopAll();
  });

  it('should throw if acl file does not exist', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.can2('controller.NonexistingController.foo', {});
      },
      'noPolicyFile',
    );

    await assertAsyncThrows(
      async () => {
        await sails.helpers.can2('controller.Classes.non-existing-action', {});
      },
      'noPolicyFile',
    );

  });

  it('should throw if acl file is invalid format', async () => {

    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {admin: new Date()},
    );


    await assertAsyncThrows(
      async () => {
        await sails.helpers.can2('controller.TestController.test-action', {authorizedRequestContext: 'admin'});
      },
      'invalidPolicyFile',
    );

  });

  it('should deny access if public access is disabled and noone is logged in', async () => {

    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {},
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {}),
      false,
    );

  });

  it('should allow access if public access is enabled', async () => {

    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {
        public: true,
      },
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {}),
      true,
    );

  });

  it('should decide access based on specific criteria if public access is a function', async () => {

    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {
        public: async req => req.user.testParameter,
      },
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {user: {testParameter: true}}),
      true,
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {user: {testParameter: false}}),
      false,
    );

  });

  it('should decide access for a customer based on the acl file', async () => {
    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {
        public: false,
        customer: false,
        teacher: true,
        checkin: true,
        admin: true,
      },
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {authorizedRequestContext: 'customer'}),
      false,
    );

    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {
        teacher: true,
        checkin: true,
        admin: true,
      },
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {authorizedRequestContext: 'customer'}),
      false,
    );

    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {
        public: false,
        customer: true,
        teacher: false,
        checkin: false,
        admin: false,
      },
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {authorizedRequestContext: 'customer'}),
      true,
    );

    mockRequire(
      path.resolve(__dirname + '/../../../api/acl/controller/TestController/test-action'),
      {
        customer: async req => req.testParameter,
      },
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {
        authorizedRequestContext: 'customer',
        testParameter: true,
      }),
      true,
    );

    await assert.strictEqual(
      await sails.helpers.can2('controller.TestController.test-action', {
        authorizedRequestContext: 'customer',
        testParameter: false,
      }),
      false,
    );

  });


});
