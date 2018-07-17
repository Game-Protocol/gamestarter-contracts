const advanceBlock = require('../helpers/advanceToBlock');
const increaseTime = require('../helpers/increaseTime');
const latestTime = require('../helpers/latestTime');
const ether = require('../helpers/ether');
const EVMRevert = "revert";

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GameTokenCrowdsale = artifacts.require('GameTokenCrowdsale');
const MockGameToken = artifacts.require('MockGameToken');

contract('GameTokenCrowdsale', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether.ether(2);
  const value2 = ether.ether(5000);
  const tokenSupply = new BigNumber('15e25');
  const goal = new BigNumber(10000);

  const expectedFeeAmount = value.mul(0.05);
  const expectedValueAfterDeduction = value.mul(0.95);
  const expectedTokenAmount = value.mul(rate);

  const owner = accounts[0];
  const investor = accounts[1];
  const investor2 = accounts[2];
  const wallet = accounts[3];
  const feeWallet = accounts[4];
  const feePercent = new BigNumber(5);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime.latestTime() + increaseTime.duration.weeks(1);
    this.closingTime = this.openingTime + increaseTime.duration.weeks(5);
    this.afterClosingTime = this.closingTime + increaseTime.duration.seconds(1);
    this.token = await MockGameToken.new("Token1");
    this.crowdsale = await GameTokenCrowdsale.new(
      goal,
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      feeWallet,
      feePercent,
      this.token.address,
      { from: owner }
    );
    await this.token.transferOwnership(this.crowdsale.address);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(investor2);
  });

  describe('transfers', function () {
    beforeEach(async function () {
      await increaseTime.increaseTimeTo(this.openingTime);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });
  
    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(expectedValueAfterDeduction);
    });
  });

  describe('finalization', function () {
    beforeEach(async function () {
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });

    it('token unpaused', async function () {
      const paused = await this.token.paused();
      assert.equal(paused, false);
    });

    it('token owner transfered', async function () {
      const tokenOwner = await this.token.owner();
      assert.equal(tokenOwner, owner);
    });
  });

  describe('failed to raise goal', function () {
    beforeEach(async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      await this.crowdsale.sendTransaction({ value: value2, from: investor2 });
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });

    it('verify refund', function () {
      await this.crowdsale.claimRefund({ from: investor }).should.be.fulfilled;

    });
  });
});
