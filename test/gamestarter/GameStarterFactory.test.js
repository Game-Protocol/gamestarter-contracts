const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Factory = artifacts.require('GameStarterFactory');

contract('GameStarterFactory', function (accounts) {

  before(async function () {
    await advanceBlock();
  });

  beforeEach(async function () {
    
  });
});