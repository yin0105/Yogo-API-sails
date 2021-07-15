module.exports = {
  friendlyName: 'Create class',

  fn: async function (inputs, exits) {

    let classData = _.pick(this.req.body, [
      'date',
      'start_time',
      'end_time',
      'class_type',
      'subtitle',
      'teachers',
      'room',
      'seats',
      'studio_attendance_enabled',
      'livestream_enabled',
    ]);

    classData.client = this.req.client.id;

    // This is for when we push the new API but livestream is not activated in the web apps yet.
    // TODO: Remove this
    if (
      typeof classData.studio_attendance_enabled === 'undefined'
      && typeof classData.livestream_enabled === 'undefined'
    ) {
      classData.studio_attendance_enabled = true;
      classData.livestream_enabled = false;
    }

    if (classData.room === '') {
      classData.room = null;
    }

    const createdClass = await Class.create(classData).fetch();

    return exits.success(createdClass);

  },
};
