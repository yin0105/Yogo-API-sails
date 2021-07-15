module.exports = {

  admin: async (req) => {
    let classTypeEmailIds = req.param('id') || req.query.id;
    if (!_.isArray(classTypeEmailIds)) {
      classTypeEmailIds = [classTypeEmailIds];
    }
    const classTypeEmails = await ClassTypeEmail.find({id: classTypeEmailIds});

    return !_.find(classTypeEmails, ce => parseInt(ce.client_id) !== parseInt(req.client.id));
  },

};
