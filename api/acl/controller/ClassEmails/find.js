const ClassEmailObjection = require('../../../objection-models/ClassEmail');

module.exports = {
  admin: async (req, inputs) => {
    let classEmailIds = inputs.id;
    if (!_.isArray(classEmailIds)) {
      classEmailIds = [classEmailIds];
    }
    const classEmails = await ClassEmail.find({id: classEmailIds});

    return !_.find(classEmails, ce => parseInt(ce.client_id) !== parseInt(req.client.id));
  },

  teacher: async (req, inputs) => {
    let classEmailIds = inputs.id;
    if (!_.isArray(classEmailIds)) {
      classEmailIds = [classEmailIds];
    }
    if (req.user.teacher_can_manage_all_classes || req.user.admin) {
      const classEmails = await ClassEmailObjection.query()
        .where('id', 'in', classEmailIds)

      return !_.find(
        classEmails,
        ce => parseInt(ce.client_id) !== parseInt(req.client.id),
      );
    }
    const classEmails = await ClassEmailObjection.query()
      .where('id', 'in', classEmailIds)
      .eager({
        'class': {
          teachers: true,
        },
      });

    return !_.find(
      classEmails,
      ce => !_.find(ce.class.teachers, {id: req.user.id}),
    );

  },

};
