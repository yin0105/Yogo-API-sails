module.exports = {
  friendlyName: 'Format date',

  description: "Formats a date in a predefined format",

  inputs: {
    date: {
      type: 'ref',
      required: true,
    },
    locale: {
      type: 'string',
      required: true,
      isIn: ['en', 'da'],
    },
    includeWeekday: {
      type: 'boolean',
      defaultsTo: true,
    },
    includeYear: {
      type: 'boolean',
      defaultsTo: true,
    },
    shortened: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  sync: true,

  fn: (inputs, exits) => {

    const date = sails.helpers.util.normalizeDate(inputs.date)

    date.locale(inputs.locale)

    const weekdayFormat = inputs.shortened ? 'ddd' : 'dddd'
    const monthFormat = inputs.shortened ? 'MMM' : 'MMMM'

    let format

    switch (inputs.locale) {
      case 'da':
        format = (inputs.includeWeekday ? weekdayFormat + ' [d.] ' : '') + 'D. ' + monthFormat + (inputs.includeYear ? ' YYYY' : '')
        break
      case 'en':
        format = (inputs.includeWeekday ? weekdayFormat + ', ' : '') + monthFormat + ' D' + (inputs.includeYear ? ', YYYY' : '')
        break
    }

    const formattedDate = date.format(format)

    return exits.success(formattedDate)
  },
}
