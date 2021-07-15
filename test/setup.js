const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiMatchPattern = require('chai-match-pattern');

chai.use(chaiAsPromised)
chai.use(chaiMatchPattern);

global.expect = chai.expect
