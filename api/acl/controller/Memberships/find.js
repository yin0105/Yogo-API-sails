module.exports = {
  admin: true,
  // Controller only sends back memberships for the current client

  customer: true,
  // Controller only sends back memberships that belongs to user,
  // if request context is "customer".
};
