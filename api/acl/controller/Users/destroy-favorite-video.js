module.exports = {

  customer(req, inputs) {
    return req.user.id === inputs.user;
  }

}
