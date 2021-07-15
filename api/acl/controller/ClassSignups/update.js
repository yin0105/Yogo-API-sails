const ClassSignupObj = require('../../../objection-models/ClassSignup');

module.exports = {

  admin: async (req) => {

    const classSignup = await ClassSignup.findOne(req.param('id'));

    return parseInt(req.user.client) === parseInt(classSignup.client);

  },

  teacher: async (req) => {
    if (req.user.teacher_can_manage_all_classes || req.user.admin) return true;

    const [classSignup] = await ClassSignupObj.query()
      .where({id: req.param('id')})
      .eager({
        'class': {
          teachers: true,
        },
      });
    return !!_.find(classSignup.class.teachers, {id: req.user.id});
  },

  checkin: async (req) => {

    const classSignup = await ClassSignup.findOne(req.param('id'));

    return parseInt(req.client.id) === parseInt(classSignup.client);

  },

};
