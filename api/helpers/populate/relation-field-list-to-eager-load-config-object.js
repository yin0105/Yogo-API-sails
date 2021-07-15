module.exports = {

  friendlyName: 'Convert a relation field list to Knex eager load config object',

  inputs: {
    inputArray: {
      type: 'json',
      description: 'An array of relation fields to populate. Dot notation specifies nested relation fields.'
    }
  },

  sync: true,

  fn: (inputs, exits) => {

    let relations
    if (_.isArray(inputs.inputsArray)) {
      relations = inputs.inputsArray
    } else {
      relations = [inputs.inputsArray]
    }

    const outputObject = {}

    inputs.inputArray.forEach(item => {
      const itemParts = item.split('.')
      let targetObject = outputObject
      while (itemParts.length) {

        if (targetObject[itemParts[0]] && targetObject[itemParts[0]] === true && itemParts.length > 1) {
          targetObject[itemParts[0]] = {}
        }

        if (!targetObject[itemParts[0]]) {
          if (itemParts.length > 1) {
            targetObject[itemParts[0]] = {}
          } else {
            targetObject[itemParts[0]] = true
          }
        }

        targetObject = targetObject[itemParts[0]]
        itemParts.shift()
      }
    })

    return exits.success(outputObject)

  }

}
