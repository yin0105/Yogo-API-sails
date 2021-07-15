module.exports = async (req, res) => {

  let classPassTypeData = _.pick(req.body, [
    'name',
    'class_types',
    'class_types_livestream',
    'video_groups',
    'access_all_videos',
    'price_groups',
    'pass_type',
    'number_of_classes',
    'days',
    'has_max_number_of_simultaneous_bookings',
    'max_number_of_simultaneous_bookings',
    'description',
    'image',
    'price',
    'send_email_to_customer',
    'email_subject',
    'email_body',
    'limited_number_per_customer',
    'max_number_per_customer',
  ])

  const currentClassPassType = await ClassPassType.findOne(req.param('id'))

  if (currentClassPassType.image && currentClassPassType.image !== classPassTypeData.image) {
    await Image.update({id: currentClassPassType.image}, {expires: 1})
  }

  if (classPassTypeData.access_all_videos === null) {
    classPassTypeData.access_all_videos = false;
  }

  const updatedClassPassType = (
    await ClassPassType.update(
      {
        id: req.param('id'),
      },
      classPassTypeData).fetch()
  )[0]

  if (classPassTypeData.image) {
    await Image.update({id: classPassTypeData.image}, {expires: 0})
  }

  return res.json(updatedClassPassType)

}
