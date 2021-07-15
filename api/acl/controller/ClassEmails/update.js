const ClassEmailObjection = require('../../../objection-models/ClassEmail');

module.exports = {
  admin: async (req, inputs) => {
    const classEmailObj = await ClassEmail.findOne({id: inputs.id});
    return parseInt(classEmailObj.client_id) === parseInt(req.client.id);
  },

  teacher: async (req, inputs) => {
    if (req.user.teacher_can_manage_all_classes || req.user.admin) {
      const classEmailObj = await ClassEmail.findOne({id: inputs.id});
      return parseInt(classEmailObj.client_id) === parseInt(req.client.id);
    }
    const classEmailObj = await ClassEmailObjection.query()
      .where({id: inputs.id})
      .eager({
        class: {
          teachers: true,
        },
      })
      .first();
    return !!_.find(classEmailObj.class.teachers, {id: req.user.id});
  },
};
