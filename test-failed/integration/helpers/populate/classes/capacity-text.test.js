const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const assert = require('assert');

const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('helpers.populate.classes.class-accepts-customer-signups', async function () {

ports.

Name: "Classest"
  before(async () => {


  });

  beforeEach(async () => {
    MockDate.set(moment.tz('2018-05-05', 'Europe/Copenhagen'));

  });

  afterEach(async () => {
    MockDate.reset();
  });

  after(async () => {


  });


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.capacityText([]);

    assert(_.isArray(result) && result.length === 0);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const classes = [{
      capacity_text: 'Few available seats',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        capacity_text: 'Few available seats',
      }],
    );

  });


  it('should return empty string for archived classes', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      archived: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        archived: true,
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

  });

  it('should return empty string for cancelled classes', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      cancelled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        cancelled: true,
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

  });

  it('should return empty string for pure livestream classes', async () => {

    const classes = [{
      livestream_enabled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        livestream_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

  });

  it('should return empty string if class has started', async () => {

    MockDate.set('2018-05-15 10:00:00', 'Europe/Copenhagen');

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

  });

  it('should return empty string if class is open (seats = 0)', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 0,
      signup_count: 0,
      client: testClientId,
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 0,
        signup_count: 0,
        capacity_text: '',
        client: testClientId,
      }],
    );

  });

  it('should return empty string if class private and not booked', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 1,
      signup_count: 0,
      client: testClientId,
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 1,
        signup_count: 0,
        capacity_text: '',
        client: testClientId,
      }],
    );

  });

  it('should return "Booked" string if class private and booked', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 1,
      signup_count: 1,
      client: testClientId,
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 1,
        signup_count: 1,
        capacity_text: 'Booked',
        client: testClientId,
      }],
    );

  });

  it('should return empty string if selected', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'none',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return "Fully booked", even if empty string if selected', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'none',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 20,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 20,
        capacity_text: 'Fully booked',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return "Fully booked (livestream open)", even if empty string if selected', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'none',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 20,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 20,
        capacity_text: 'Fully booked (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return number of available seats', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'number_of_available_seats',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '15 available seats',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return number of available seats for class with livestream', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'number_of_available_seats',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '15 available seats (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return 1 available seat', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'number_of_available_seats',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 19,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 19,
        capacity_text: '1 available seat',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return 1 available seat for class with livestream', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'number_of_available_seats',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 19,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 19,
        capacity_text: '1 available seat (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return "Fully booked", when number of available seats is selected', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'number_of_available_seats',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 20,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 20,
        capacity_text: 'Fully booked',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return "Fully booked", when number of available seats is selected for class with livestream', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'number_of_available_seats',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 20,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 20,
        capacity_text: 'Fully booked (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return available/total seats', async () => {


    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '5/20',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

  });

  it('should return available/total seats for class with livestream', async () => {


    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 5,
        capacity_text: '5/20 (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

  });

  it('should return warning on few seats left', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'warning_on_few_seats_left',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 17,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 17,
        capacity_text: 'Few available seats',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return warning on few seats left for class with livestream', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'warning_on_few_seats_left',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 17,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 17,
        capacity_text: 'Few available seats (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return no warning on several seats left', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'warning_on_few_seats_left',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 16,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 16,
        capacity_text: '',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return no warning on several seats left for class with livestream', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'warning_on_few_seats_left',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 16,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 16,
        capacity_text: '',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return custom warning on few seats left', async () => {

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'calendar_capacity_info_format',
        value: 'warning_on_few_seats_left',
      },
      {
        client: testClientId,
        key: 'calendar_few_seats_left_warning_text',
        value: 'Custom warning',
      },
    ]).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 17,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 17,
        capacity_text: 'Custom warning',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: _.map(clientSettingsRows,'id')});

  });

  it('should return custom warning on few seats left for class with livestream', async () => {

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'calendar_capacity_info_format',
        value: 'warning_on_few_seats_left',
      },
      {
        client: testClientId,
        key: 'calendar_few_seats_left_warning_text',
        value: 'Custom warning',
      },
    ]).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 17,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 17,
        capacity_text: 'Custom warning (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: _.map(clientSettingsRows,'id')});

  });

  it('should return warning on custom number of seats left', async () => {

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'calendar_capacity_info_format',
        value: 'warning_on_few_seats_left',
      },
      {
        client: testClientId,
        key: 'calendar_few_seats_left_warning_limit',
        value: 10,
      },
    ]).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 10,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 10,
        capacity_text: 'Few available seats',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: _.map(clientSettingsRows,'id')});

  });

  it('should return warning on custom number of seats left for class with livestream', async () => {

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'calendar_capacity_info_format',
        value: 'warning_on_few_seats_left',
      },
      {
        client: testClientId,
        key: 'calendar_few_seats_left_warning_limit',
        value: 10,
      },
    ]).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 10,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 10,
        capacity_text: 'Few available seats (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: _.map(clientSettingsRows,'id')});

  });

  it('should return "Fully booked" if warning on few seats left is selected', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'warning_on_few_seats_left',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 20,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 20,
        capacity_text: 'Fully booked',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return "Fully booked" if warning on few seats left is selected, for class with livestream', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'warning_on_few_seats_left',
    }).fetch();

    const classes = [{
      studio_attendance_enabled: true,
      livestream_enabled: true,
      seats: 20,
      signup_count: 20,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }];

    await sails.helpers.populate.classes.capacityText(classes);

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        livestream_enabled: true,
        seats: 20,
        signup_count: 20,
        capacity_text: 'Fully booked (livestream open)',
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });


});


