module.exports = {
  admin: async (req) => {
    const classTypeEmailObj = await ClassTypeEmail.findOne({id: req.param('id')});
    return parseInt(classTypeEmailObj.client_id) === parseInt(req.client.id);
  },

};
