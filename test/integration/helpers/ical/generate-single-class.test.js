const assert = require('assert');
const fixtures = require('../../../fixtures/factory').fixtures;
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

describe('helpers.ical.generate-single-class', async () => {

  it('should generate ical data for a single class', async () => {

    const classItem = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-15',
      start_time: '15:00:00',
      end_time: '16:30:00',
      room: fixtures.testClientRoomA1.id,
      teachers: [fixtures.userEvelyn.id],
    }).fetch();

    const icalData = await sails.helpers.ical.generateSingleClass(classItem);
    console.log("icalData = ", icalData)
    const sanitizedIcalData = icalData
      .replace(/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/g, '')
      .replace(/DTSTAMP:\d{8}T\d{6}Z/g, 'DTSTAMP:');

    const expectedResult = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:Yogo API
METHOD:PUBLISH
X-PUBLISHED-TTL:PT5M
BEGIN:VEVENT
UID:
SUMMARY:Yoga
DTSTAMP:
DTSTART:20200515T130000Z
DTEND:20200515T143000Z
DESCRIPTION:with Evelyn.
LOCATION:Room A1, Branch A.
END:VEVENT
END:VCALENDAR
`.replace(/\n/g, '\r\n')

    assert.strictEqual(
      sanitizedIcalData,
      expectedResult,
    );

    await Class.destroy({id: classItem.id});

  });

});
