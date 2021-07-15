module.exports = (value) => {
  const payTypes = {
    'DK': 'Dankort',
    'dankort': 'Dankort',
    'visa': 'VISA',
    'visa_dk': 'VISA/Dankort',
    'V-DK': 'VISA/Dankort',
    'MC(DK)': 'Eurocard/Mastercard (DK)',
    'MC(SE)': 'Eurocard/Mastercard (SE)',
    'MC': 'Eurocard/Mastercard',
    'mc': 'Mastercard',
    'ELEC': 'VISA Electron',
    'visa_elec': 'VISA Electron',
    'amex': 'American Express',
    'jcb': 'JCB',
    'maestro': 'Maestro',
    'laser': 'Laser',
    'diners': 'Diners',
    'discover': 'Discover',
    'china_union_pay': 'China Union Pay',
    'ffk': 'Forbrugsforeningen',
    'DKW': 'Dankort app',
    'MPO_Nets': 'MobilePay Online',
    'FREE': 'n/a',
  }
  if (payTypes[value]) {
    return payTypes[value]
  } else {
    return value
  }

}
