const advanceBlock = require('../helpers/advanceToBlock');
const increaseTime = require('../helpers/increaseTime');
const latestTime = require('../helpers/latestTime');
const ether = require('../helpers/ether');
const { signHex } = require('../helpers/sign');
const EVMRevert = "revert";

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Token = artifacts.require('MintableToken');
const Crowdsale = artifacts.require('MockCrowdsale');

contract('MockCrowdsale', function ([_, owner, wallet, feeWallet, authorized, unauthorized]) {
  const rate = new BigNumber(1000);
  const goal = ether.ether(10000);
  const feePercent = new BigNumber(5);

  before(async function () {
    await advanceBlock.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime.latestTime() + increaseTime.duration.weeks(1);
    this.closingTime = this.openingTime + increaseTime.duration.weeks(5);
    this.afterClosingTime = this.closingTime + increaseTime.duration.seconds(1);
    this.token = await Token.new();
      this.crowdsale = await Crowdsale.new(
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      this.token.address,
      goal,
      feeWallet,
      feePercent
    );
  });

  describe('packages test', function () {
    
    it('empty test', async function () {
      
    });
  });
});