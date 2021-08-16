const assert = require('assert');
const moment = require('moment-timezone');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const assertAsyncThrows = require('../../../utils/assert-async-throws');

describe('helpers.string.fillInVariables', function () {

  it('should return the provided text, with bracket variables filled in.', async () => {

    const resultText = await sails.helpers.string.fillInVariables(
      `var1 [var1] var2æøå [var2æøå]
var3 [var3] [var1] [var1]
more text`,
      {
        var1: 'value1',
        var2æøå: 'value2æøå',
        var3: 'value3',
      },
    );

    assert.equal(
      resultText,
      `var1 value1 var2æøå value2æøå
var3 value3 value1 value1
more text`,
    );

  });

  it('should fill in multiple texts, and use source objects for standard variables', async () => {

    const [result1, result2, result3, result4] = await sails.helpers.string.fillInVariables(
      [
        '[studio_name], [studio_address_1], [studio_address_2], [studio_zip_code], [studio_city], [studio_email], [studio_phone], [studio_website]',
        '[customer_first_name], [customer_last_name], [customer_address_1], [customer_address_2], [customer_zip_code], [customer_city], [customer_email], [customer_phone], [first_name], [last_name], [address_1], [address_2], [zip_code], [city], [email], [phone], [customer_full_name], [customer_name], [full_name], [name], [customer_profile_link], [profile_link], [customer_purchase_history], [purchase_history], [customer_purchase_history_link], [purchase_history_link]',
        '[class_date], [class_start_time], [class_end_time], [class_name], [class_type], [class_type_name]',
        '[livestream_link]'
      ],
      {},
      {
        customer: {
          client: testClientId,
          first_name: 'CustomerFirstname',
          last_name: 'CustomerLastname',
          address_1: 'CustomerAddress1',
          address_2: 'CustomerAddress2',
          zip_code: 'CustomerZipcode',
          city: 'CustomerCity',
          email: 'CustomerEmail',
          phone: 'CustomerPhone',
        },
        studio: {
          name: 'StudioName',
          address_1: 'StudioAddress1',
          address_2: 'StudioAddress2',
          zip_code: 'StudioZipcode',
          city: 'StudioCity',
          email: 'StudioEmail',
          phone: 'StudioPhone',
          website: 'StudioWebsite',
        },
        class: {
          client: testClientId,
          id: 99999999,
          date: moment.tz('2020-08-02', 'Europe/Copenhagen').toDate(),
          start_time: '10:00:00',
          end_time: '12:00:00',
          class_type: {
            name: 'ClassTypeName',
          },
        },
      },
      'en',
    );

    expect(result1).to.equal('StudioName, StudioAddress1, StudioAddress2, StudioZipcode, StudioCity, StudioEmail, StudioPhone, StudioWebsite');
    expect(result2).to.equal('CustomerFirstname, CustomerLastname, CustomerAddress1, CustomerAddress2, CustomerZipcode, CustomerCity, CustomerEmail, CustomerPhone, CustomerFirstname, CustomerLastname, CustomerAddress1, CustomerAddress2, CustomerZipcode, CustomerCity, CustomerEmail, CustomerPhone, CustomerFirstname CustomerLastname, CustomerFirstname CustomerLastname, CustomerFirstname CustomerLastname, CustomerFirstname CustomerLastname, https://test-client.yogo.dk/frontend/index.html#/my-profile, https://test-client.yogo.dk/frontend/index.html#/my-profile, https://test-client.yogo.dk/frontend/index.html#/purchase-history, https://test-client.yogo.dk/frontend/index.html#/purchase-history, https://test-client.yogo.dk/frontend/index.html#/purchase-history, https://test-client.yogo.dk/frontend/index.html#/purchase-history');
    expect(result3).to.equal('Sunday, August 2, 2020, 10:00, 12:00, ClassTypeName, ClassTypeName, ClassTypeName');
    expect(result4).to.equal('https://test-client.yogo.dk/frontend/index.html#/livestream/class/99999999/preloader')
  });

  it('should find source objects in db if only IDs are provided', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-08-03',
      class_type: fixtures.classTypeYoga.id,
      start_time: '10:00:00',
      end_time: '12:00:00',
    }).fetch();
    const result = await sails.helpers.string.fillInVariables(
      '[customer_first_name], [studio_name], [class_start_time], [class_type]',
      {},
      {
        customer: fixtures.userAlice.id,
        studio: testClientId,
        'class': classObj.id,
      },
      'en',
    );

    expect(result).to.equal('Alice, Test client, 10:00, Yoga');

    await Class.destroy({id: classObj.id})

    const result2 = await sails.helpers.string.fillInVariables(
      '[customer_first_name], [studio_name], [class_start_time], [class_type]',
      {},
      {
        customer: fixtures.userAlice.id,
        studio: testClientId,
        'class': {
          client: testClientId,
          class_type: fixtures.classTypeYoga.id,
          date: '2020-08-03',
          start_time: '14:00:00',
          end_time: '16:00:00'
        },
      },
      'en',
    );

    expect(result2).to.equal('Alice, Test client, 14:00, Yoga');

  });

  it('should prioritize individually provided values over source object standard values', async () => {
    const result = await sails.helpers.string.fillInVariables(
      '[customer_first_name]',
      {
        customer_first_name: 'Aisha'
      },
      {
        customer: fixtures.userAlice.id,
      },
      'en',
    );

    expect(result).to.equal('Aisha')
  });

  it('should throw if class source object is provided, but no locale is provided', async () => {
    await assertAsyncThrows(
      async () => {
        await sails.helpers.string.fillInVariables(
          'asdf',
          {},
          {
            'class': {}
          },
        );
      },
      'classSourceObjectRequiresLocale'
    )
  });


});


