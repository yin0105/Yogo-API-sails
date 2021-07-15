const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Class ICS file',

  exits: {
    classDoesNotExist: {
      responseType: 'badRequest',
    },
    classHasBeenDeleted: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const classItem = await Class.findOne(this.req.param('id')).populate('class_type');

    if (!classItem) {
      return exits.classDoesNotExist('Class does not exist');
    }

    if (classItem.archived) {
      return exits.classHasBeenDeleted('Class has been deleted');
    }

    const iCalData = await sails.helpers.ical.generateSingleClass(classItem);

    const classDateFormatted = moment(classItem.date).format('YYYY-MM-DD');

    const classStart = moment.tz(classDateFormatted + ' ' + classItem.start_time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen').tz('UTC');

    this.res.attachment(classItem.class_type.name + ' ' + classStart.tz('Europe/Copenhagen').format('YYYY-MM-DD HH:mm') + '.ics');
    return exits.success(iCalData);


  },
};
