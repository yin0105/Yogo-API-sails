module.exports =  async (req, res) => {

  const classPassType = await ClassPassType.findOne(req.param('id'))

  if (classPassType.image) {
    await Image.update({id: classPassType.image}, {expires: 1})
  }

  await ClassPassType.update({id: req.param('id')}, {archived: true})
  return res.ok()
}
