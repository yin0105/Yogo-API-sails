const assert = require('assert');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const sinon = require('sinon');

describe('helpers.class-email.send', async () => {

  let emailSendFake,
    originalFunction;

  let classItem,
    signups,
    waitingListSignups,
    livestreamSignups,
    classEmail;

  before(async () => {
    await ClassSignup.destroy({});
    await ClassWaitingListSignup.destroy({});
    await ClassLivestreamSignup.destroy({})
  })

  beforeEach(async () => {
    emailSendFake = sinon.fake();
    originalFunction = sails.helpers.email.send;
    sails.helpers.email.send = {with: emailSendFake};

    classItem = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '20:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    signups = await ClassSignup.createEach([
      {
        client: testClientId,
        user: fixtures.userAlice.id,
        'class': classItem.id,
      },
      {
        client: testClientId,
        user: fixtures.userBill.id,
        'class': classItem.id,
      },
    ]).fetch();

    waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        client: testClientId,
        user: fixtures.userCharlie.id,
        'class': classItem.id,
      },
      {
        client: testClientId,
        user: fixtures.userDennis.id,
        'class': classItem.id,
      },
    ]).fetch();

    livestreamSignups = await ClassLivestreamSignup.createEach([
      {
        client: testClientId,
        user: fixtures.userEvelyn.id,
        'class': classItem.id,
      },
    ]).fetch();

    classEmail = await ClassEmail.create({
      client_id: testClientId,
      'class_id': classItem.id,
      sender_id: fixtures.userAdmin.id,
      subject: 'Test subject [first_name], [last_name], [email]',
      body: 'Test body [first_name], [last_name], [email]',
      send_to_signups: true,
      send_to_livestream_signups: false,
      send_to_subsequent_signups: false,
      auto_send_status: 'off',
      send_in_progress: false,
    }).fetch();

  });

  afterEach(async () => {
    sails.helpers.email.send = originalFunction;

    await Class.destroy({id: classItem.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await ClassLivestreamSignup.destroy({id: _.map(livestreamSignups, 'id')});
    await ClassEmail.destroy({id: classEmail.id});
  });


  it('should create missing email instances and send the email', async () => {

    const existingInstance = await ClassEmailInstance.create({
      class_email_id: classEmail.id,
      recipient_id: fixtures.userBill.id,
      client_id: testClientId,
    }).fetch();

    await sails.helpers.classEmail.send(classEmail);

    const instances = await ClassEmailInstance.find({});

    instances.sort((a, b) => {
      return a.recipient_id > b.recipient_id ? 1 : -1;
    });

    expect(instances).matchPattern(
      `[
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userAlice.id},
          class_email_id: ${classEmail.id},
          ...
        },
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userBill.id},
          class_email_id: ${classEmail.id},
          ...
        }        
      ]`,
    );

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`
      {       
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Test subject Alice, Ali, userAlice@yogo.dk',
        text: 'Test body Alice, Ali, userAlice@yogo.dk',
        emailType: 'class_email'
      }`
    );

    assert.strictEqual(
      emailSendFake.callCount,
      1,
    );

    await ClassEmailInstance.destroy({id: existingInstance.id});
    await ClassEmailInstance.destroy({id: _.map(instances, 'id')});

  });

  it('should also send to waiting list signups, if chosen', async () => {

    await ClassEmail.update({id: classEmail.id}, {send_to_waiting_list: true});

    const existingInstances = await ClassEmailInstance.createEach([
      {
        class_email_id: classEmail.id,
        recipient_id: fixtures.userBill.id,
        client_id: testClientId,
      },
      {
        class_email_id: classEmail.id,
        recipient_id: fixtures.userCharlie.id,
        client_id: testClientId,
      },
    ]).fetch();

    await sails.helpers.classEmail.send(classEmail);

    const instances = await ClassEmailInstance.find({});
    
    instances.sort((a, b) => {
      return a.recipient_id > b.recipient_id ? 1 : -1;
    });

    console.log("instances = ", instances)
    console.log(fixtures.userDennis.id, fixtures.userAlice.id)

    expect(instances).matchPattern(
      `[
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userAlice.id},
          class_email_id: ${classEmail.id},
          ...
        },
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userBill.id},
          class_email_id: ${classEmail.id},
          ...
        },
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userCharlie.id},
          class_email_id: ${classEmail.id},
          ...
        },   
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userDennis.id},
          class_email_id: ${classEmail.id},
          ...
        },
      ]`,
    );
    
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`
      {        
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Test subject Alice, Ali, userAlice@yogo.dk',
        text: 'Test body Alice, Ali, userAlice@yogo.dk',
        emailType: 'class_email'
      }`
    );
    expect(emailSendFake.getCall(1).args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userDennis.id}, ... },
        subject: 'Test subject Dennis, Dentist, userDennis@yogo.dk',
        text: 'Test body Dennis, Dentist, userDennis@yogo.dk',
        emailType: 'class_email'
      }`
    );

    assert.strictEqual(
      emailSendFake.callCount,
      2,
    );

    await ClassEmailInstance.destroy({id: _.map(existingInstances, 'id')});
    await ClassEmailInstance.destroy({id: _.map(instances, 'id')});

  });

  it('should also send to livestream signups, if chosen', async () => {

    await ClassEmail.update({id: classEmail.id}, {send_to_livestream_signups: true});

    const existingInstances = await ClassEmailInstance.createEach([
      {
        class_email_id: classEmail.id,
        recipient_id: fixtures.userBill.id,
        client_id: testClientId,
      },
      {
        class_email_id: classEmail.id,
        recipient_id: fixtures.userCharlie.id,
        client_id: testClientId,
      },
    ]).fetch();

    await sails.helpers.classEmail.send(classEmail);

    const instances = await ClassEmailInstance.find({});

    instances.sort((a, b) => {
      return a.recipient_id > b.recipient_id ? 1 : -1;
    });

    expect(instances).matchPattern(
      `[
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userAlice.id},
          class_email_id: ${classEmail.id},
          ...
        },        
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userBill.id},
          class_email_id: ${classEmail.id},
          ...
        },
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userCharlie.id},
          class_email_id: ${classEmail.id},
          ...
        },
        {
          client_id: ${testClientId},
          recipient_id: ${fixtures.userEvelyn.id},
          class_email_id: ${classEmail.id},
          ...
        },      
      ]`,
    );

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`
      {        
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'Test subject Alice, Ali, userAlice@yogo.dk',
        text: 'Test body Alice, Ali, userAlice@yogo.dk',
        emailType: 'class_email'
      }`
    );
    expect(emailSendFake.getCall(1).args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userEvelyn.id}, ...},
        subject: 'Test subject Evelyn, Everlast, userEvelyn@yogo.dk',
        text: 'Test body Evelyn, Everlast, userEvelyn@yogo.dk',
        emailType: 'class_email'
      }`
    );

    assert.strictEqual(
      emailSendFake.callCount,
      2,
    );

    await ClassEmailInstance.destroy({id: _.map(existingInstances, 'id')});
    await ClassEmailInstance.destroy({id: _.map(instances, 'id')});

  });

});
