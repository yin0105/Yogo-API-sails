const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

describe('helpers.order.start-processing-if-not-already-started', async () => {

  it('should start processing order, but make sure it only happens once on simultaneous requests', async () => {

    const order = await Order.create({
      client: testClientId,
    }).fetch();

    const timestampBeforeCall = Date.now();
    const results = await Promise.all([
      sails.helpers.order.startProcessingIfNotAlreadyStarted(order, 'paid'),
      sails.helpers.order.startProcessingIfNotAlreadyStarted(order, 'paid'),
    ]);
    const timestampAfterCall = Date.now();

    expect(results).to.matchPattern(`[
      true,
      false,
      ===
    ]`);

    const updatedOrder = await Order.findOne(order.id);

    expect(updatedOrder).to.matchPattern(`{
      payment_failed: 0,
      paid: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ...
    }`);

    await Order.destroy({id: order.id});

  });

  it('should start processing payment_failed', async () => {

    const order = await Order.create({
      client: testClientId,
    }).fetch();

    const timestampBeforeCall = Date.now();
    const results = await Promise.all([
      sails.helpers.order.startProcessingIfNotAlreadyStarted(order, 'failed'),
      sails.helpers.order.startProcessingIfNotAlreadyStarted(order, 'failed'),
    ]);
    const timestampAfterCall = Date.now();

    expect(results).to.matchPattern(`[
      true,
      false,
      ===
    ]`);

    const updatedOrder = await Order.findOne(order.id);

    expect(updatedOrder).to.matchPattern(`{
      paid: 0,
      payment_failed: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ...
    }`);

    await Order.destroy({id: order.id});

  });

});
