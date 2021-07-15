const currencyFormatter = require('currency-formatter')

module.exports = (value) => {

  return currencyFormatter.format(value, {
    locale:'da-DK',
    format: '%v',
    thousand: '.'
  })

}
