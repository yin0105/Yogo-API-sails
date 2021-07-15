const moment = require('moment')

module.exports = async (req, res) => {

  let query = ClassPassType.findOne(req.param('id'))

  let populateFields = []

  if (req.query.populate) {

    populateFields = _.keyBy(
      _.intersection(
        req.query.populate,
        [
          'image',
          'class_types',
          'class_types_livestream',
          'video_groups',
          'price_groups',
          'class_passes',
          'class_passes.user',
          'class_passes.user.image',
        ],
      ),
    )
  }

  _.each(['image', 'class_types', 'class_types_livestream', 'video_groups', 'price_groups'], populateField => {
    if (populateFields[populateField]) {

      if (populateField === 'image') {
        query.populate(populateField)
      } else {
        query.populate(populateField, {archived: false})
      }

    }
  })

  const classPassType = await query

  if (populateFields.class_passes) {

    let classPassTypeQueryCriteria = {
      class_pass_type: classPassType.id,
      archived: 0,
      valid_until: {
        '>=': moment().startOf('day').format('YYYY-MM-DD'),
      },
    }

    if (classPassType.pass_type === 'fixed_count') {
      classPassTypeQueryCriteria.classes_left = {
        '>': 0,
      }
    }

    const classPassQuery = ClassPass.find(classPassTypeQueryCriteria)

    if (populateFields['class_passes.user']) {
      classPassQuery.populate('user')
    }
    const classPasses = await classPassQuery

    if (populateFields['class_passes.user'] && populateFields['class_passes.user.image']) {
      const imageIds = _.compact(_.map(classPasses, classPass => classPass.user.image))
      const images = _.keyBy(Image.find({id: imageIds}), 'id')
      _.each(classPasses, classPass => {
        if (classPass.user.image) {
          classPass.user.image = images[classPass.user.image]
        }
      })
    }

    classPassType.class_passes = classPasses
  }

  return res.json(classPassType)

}
