const supertest = require('supertest')
const qs = require('qs')
const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures

const MockDate = require('mockdate')
const moment = require('moment-timezone')

describe('populate capacity_text', () => {

  let class1,
    class2,
    class3,
    class4,
    class5,
    classArchived,
    classOtherClient,
    classCancelled,
    classHasStarted,
    privateLessonAvailable,
    privateLessonBooked,
    openClass,
    signups = []

  before(async () => {
    class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-11',
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 20,
    }).fetch()

    class2 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-12',
      start_time: '18:00:00',
      end_time: '20:00:00',
      seats: 4,
    }).fetch()

    class3 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeHotYoga.id,
      date: '2018-05-13',
      start_time: '10:00:00',
      end_time: '12:00:00',
      seats: 6,
    }).fetch()

    class4 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeHotYoga.id,
      date: '2018-05-14',
      start_time: '23:59:59',
      end_time: '02:00:00',
      seats: 20,
    }).fetch()

    class5 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeHotYoga.id,
      date: '2018-05-15',
      start_time: '00:00:00',
      end_time: '02:00:00',
      seats: 20,
    }).fetch()

    classArchived = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-13',
      start_time: '10:00:00',
      end_time: '12:00:00',
      archived: true,
      seats: 20,
    }).fetch()

    classOtherClient = await Class.create({
      client: testClientId + 1,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-13',
      start_time: '10:00:00',
      end_time: '12:00:00',
      seats: 20,
    }).fetch()

    classCancelled = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-13',
      start_time: '10:00:00',
      end_time: '12:00:00',
      cancelled: true,
      seats: 20,
    }).fetch()

    classHasStarted = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-11',
      start_time: '10:00:00',
      end_time: '12:00:00',
      cancelled: true,
      seats: 20,
    }).fetch()

    privateLessonAvailable = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-20',
      start_time: '10:00:00',
      end_time: '12:00:00',
      seats: 1,
    }).fetch()

    privateLessonBooked = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-20',
      start_time: '10:00:00',
      end_time: '12:00:00',
      seats: 1,
    }).fetch()


    openClass = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-21',
      start_time: '10:00:00',
      end_time: '12:00:00',
      seats: 0,
    }).fetch()

    signups = await Promise.all(
      _.map(
        [
          {
            'class': class1.id,
            user: fixtures.userAlice.id,
          },
          {
            'class': class1.id,
            user: fixtures.userBill.id,
          },
          {
            'class': class1.id,
            user: fixtures.userCharlie.id,
          },
          {
            'class': class1.id,
            user: fixtures.userDennis.id,
          },
          {
            'class': class2.id,
            user: fixtures.userAlice.id,
          },
          {
            'class': class2.id,
            user: fixtures.userBill.id,
          },
          {
            'class': class2.id,
            user: fixtures.userCharlie.id,
          },
          {
            'class': class2.id,
            user: fixtures.userDennis.id,
          },
          {
            'class': class3.id,
            user: fixtures.userAlice.id,
          },
          {
            'class': class3.id,
            user: fixtures.userBill.id,
          },
          {
            'class': class3.id,
            user: fixtures.userCharlie.id,
          },
          {
            'class': class3.id,
            user: fixtures.userDennis.id,
          },
          {
            'class': classHasStarted.id,
            user: fixtures.userAlice.id,
          },
          {
            'class': classHasStarted.id,
            user: fixtures.userBill.id,
          },
          {
            'class': classHasStarted.id,
            user: fixtures.userCharlie.id,
          },
          {
            'class': classHasStarted.id,
            user: fixtures.userDennis.id,
          },
          {
            'class': privateLessonBooked.id,
            user: fixtures.userDennis.id,
          },
        ],
        signup => ClassSignup.create(signup),
      ),
    )

    MockDate.set(moment.tz('2018-05-11 10:00:00', 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen'))

  })

  after(async () => {
    await Class.destroy({
      id: [
        class1.id,
        class2.id,
        class3.id,
        class4.id,
        class5.id,
        classArchived.id,
        classOtherClient.id,
        classCancelled.id,
        classHasStarted.id,
        privateLessonAvailable.id,
        privateLessonBooked.id,
        openClass.id
      ],
    })

    await ClassSignup.destroy({
      id: _.map(signups, 'id'),
    })

    MockDate.reset()
  })


  it('should return available_slash_total_seats', async () => {

    const settingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'available_slash_total_seats',
    }).fetch()

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['capacity_text'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .expect(200)

    let classes = response.body.classes

    classes = _
      .chain(classes)
      .sortBy('id')
      .map(
        cls => {
          return _.pick(cls, ['id', 'capacity_text'])
        },
      )
      .value()

    assert.deepEqual(
      classes,
      [
        {
          id: class1.id,
          capacity_text: '4/20',
        },
        {
          id: class2.id,
          capacity_text: '4/4',
        },
        {
          id: class3.id,
          capacity_text: '4/6',
        },
        {
          id: class4.id,
          capacity_text: '0/20',
        },
        {
          id: class5.id,
          capacity_text: '0/20',
        },
        {
          id: classCancelled.id,
          capacity_text: '',
        },
        {
          id: classHasStarted.id,
          capacity_text: '',
        },
        {
          id: privateLessonAvailable.id,
          capacity_text: '',
        },
        {
          id: privateLessonBooked.id,
          capacity_text: 'Booked',
        },
        {
          id: openClass.id,
          capacity_text: '',
        },
      ],
    )

    await ClientSettings.destroy({id: settingsRow.id})

  })

  it('should return warning_on_few_seats_left', async () => {

    const settingFormat = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'warning_on_few_seats_left',
    }).fetch()

    const settingLimit = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_few_seats_left_warning_limit',
      value: '2',
    }).fetch()

    const settingWarning = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_few_seats_left_warning_text',
      value: 'Only few seats left',
    }).fetch()

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['capacity_text'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .expect(200)

    let classes = response.body.classes

    classes = _
      .chain(classes)
      .sortBy('id')
      .map(
        cls => {
          return _.pick(cls, ['id', 'capacity_text'])
        },
      )
      .value()

    assert.deepEqual(
      classes,
      [
        {
          id: class1.id,
          capacity_text: '',
        },
        {
          id: class2.id,
          capacity_text: 'Fully booked',
        },
        {
          id: class3.id,
          capacity_text: 'Only few seats left',
        },
        {
          id: class4.id,
          capacity_text: '',
        },
        {
          id: class5.id,
          capacity_text: '',
        },
        {
          id: classCancelled.id,
          capacity_text: '',
        },
        {
          id: classHasStarted.id,
          capacity_text: '',
        },
        {
          id: privateLessonAvailable.id,
          capacity_text: '',
        },
        {
          id: privateLessonBooked.id,
          capacity_text: 'Booked',
        },
        {
          id: openClass.id,
          capacity_text: '',
        },
      ],
    )

    await ClientSettings.destroy({id: [settingFormat.id, settingLimit.id, settingWarning.id]})

  })

  it('should return empty strings if so specified', async () => {

    const settingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'none',
    }).fetch()

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['capacity_text'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .expect(200)

    const classes = _
      .chain(response.body.classes)
      .orderBy('id')
      .map(
        cls => {
          return _.pick(cls, ['id', 'capacity_text'])
        },
      )
      .value()

    assert.deepEqual(
      classes,
      [
        {
          id: class1.id,
          capacity_text: '',
        },
        {
          id: class2.id,
          capacity_text: 'Fully booked',
        },
        {
          id: class3.id,
          capacity_text: '',
        },
        {
          id: class4.id,
          capacity_text: '',
        },
        {
          id: class5.id,
          capacity_text: '',
        },
        {
          id: classCancelled.id,
          capacity_text: '',
        },
        {
          id: classHasStarted.id,
          capacity_text: '',
        },
        {
          id: privateLessonAvailable.id,
          capacity_text: '',
        },
        {
          id: privateLessonBooked.id,
          capacity_text: 'Booked',
        },
        {
          id: openClass.id,
          capacity_text: '',
        },
      ],
    )

    await ClientSettings.destroy({id: settingsRow.id})

  })

  it('should return number of available seats if so specified', async () => {

    const settingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'calendar_capacity_info_format',
      value: 'number_of_available_seats',
    }).fetch()

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      populate: ['capacity_text'],
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes')
      .query(query)
      .expect(200)

    const classes = _
      .chain(response.body.classes)
      .orderBy('id')
      .map(
        cls => {
          return _.pick(cls, ['id', 'capacity_text'])
        },
      )
      .value()

    assert.deepEqual(
      classes,
      [
        {
          id: class1.id,
          capacity_text: '16 available seats',
        },
        {
          id: class2.id,
          capacity_text: 'Fully booked',
        },
        {
          id: class3.id,
          capacity_text: '2 available seats',
        },
        {
          id: class4.id,
          capacity_text: '20 available seats',
        },
        {
          id: class5.id,
          capacity_text: '20 available seats',
        },
        {
          id: classCancelled.id,
          capacity_text: '',
        },
        {
          id: classHasStarted.id,
          capacity_text: '',
        },
        {
          id: privateLessonAvailable.id,
          capacity_text: '',
        },
        {
          id: privateLessonBooked.id,
          capacity_text: 'Booked',
        },
        {
          id: openClass.id,
          capacity_text: '',
        },
      ],
    )

    await ClientSettings.destroy({id: settingsRow.id})

  })


})
