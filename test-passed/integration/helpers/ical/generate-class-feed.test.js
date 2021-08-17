const assert = require('assert');
const fixtures = require('../../../fixtures/factory').fixtures;
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

describe('helpers.ical.generate-class-feed', async () => {

  it('should generate ical data for a number of classes', async () => {

    const classItem1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-15',
      start_time: '15:00:00',
      end_time: '16:30:00',
      room: fixtures.testClientRoomA1.id,
      teachers: [fixtures.userEvelyn.id],
    }).fetch();

    const classItem2 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-17',
      start_time: '15:00:00',
      end_time: '16:30:00',
      room: fixtures.testClientRoomA1.id,
      teachers: [fixtures.userEvelyn.id],
    }).fetch();

    const icalData = await sails.helpers.ical.generateCalendarFeed.with({
      classes: [classItem1, classItem2],
      calendarName: 'Test calendar feed',
    });
    // const sanitizedIcalData = icalData
    //   .replace(/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/g, '')
    //   .replace(/DTSTAMP:\d{8}T\d{6}Z/g, 'DTSTAMP:');

//     const expectedResult = `BEGIN:VCALENDAR
// VERSION:2.0
// CALSCALE:GREGORIAN
// PRODID:Yogo API
// METHOD:PUBLISH
// X-WR-CALNAME:Test calendar feed
// X-PUBLISHED-TTL:PT5M
// BEGIN:VEVENT
// UID:
// SUMMARY:Yoga
// DTSTAMP:
// DTSTART:20200515T130000Z
// DTEND:20200515T143000Z
// DESCRIPTION:with Evelyn.
// LOCATION:Room A1, Branch A.
// END:VEVENT
// BEGIN:VEVENT
// UID:
// SUMMARY:Yoga
// DTSTAMP:
// DTSTART:20200517T130000Z
// DTEND:20200517T143000Z
// DESCRIPTION:with Evelyn.
// LOCATION:Room A1, Branch A.
// END:VEVENT
// END:VCALENDAR
// `.replace(/\n/g, '\r\n');

//     assert.strictEqual(
//       sanitizedIcalData,
//       expectedResult,
//     );

    await Class.destroy({id: [classItem1.id, classItem2.id]});

  });

});
