module.exports = async (req, res) => {

  if (!req.user.admin) {
    return res.forbidden()
  }

  if (
    !(
      await sails.helpers.acl.objectIdsBelongToClient.with({
        objectIds: req.body.sortOrder,
        model: 'Branch',
        client: req.client,
      })
    )
  ) {
    return res.forbidden()
  }


  let branchIds = req.body.sortOrder

  if (!_.isArray(branchIds) || !branchIds.length) {
    return res.badRequest('Invalid input')
  }

  branchIds = _.map(
    branchIds,
    branchId => parseInt(branchId),
  )

  await Promise.all(
    _.map(
      branchIds,
      (id, idx) => Branch.update(
        {
          id: id,
          client: req.client.id,
        },
        {
          sort: idx,
        },
      ),
    ),
  )

  return res.ok()

}
