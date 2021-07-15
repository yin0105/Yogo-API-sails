const assert = require('assert');
const payTypeFilter = require('../../../api/filters/pay_type')

describe('filters.pay_type', () => {

  it('should return expanded descriptions for pay types', () => {
    const payTypes = {
      'DK': 'Dankort',
      'V-DK': 'VISA/Dankort',
      'MC(DK)': 'Eurocard/Mastercard (DK)',
      'MC(SE)': 'Eurocard/Mastercard (SE)',
      'MC': 'Eurocard/Mastercard',
      'ELEC': 'VISA Electron',
      'DKW': 'Dankort app',
      'MPO_Nets': 'MobilePay Online',
      'TEST': 'TEST',
      'ABCD':'ABCD'
    }
    _.each(payTypes, (value, key) => {
      assert.equal(
        payTypeFilter(key),
        value
      )
    })
    assert.equal(
      payTypeFilter(''),
      ''
    )

  })

})
