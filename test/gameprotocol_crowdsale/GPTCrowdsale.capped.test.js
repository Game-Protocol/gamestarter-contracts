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

const GPTCrowdsale = artifacts.require('GPTCrowdsale');
const GPToken = artifacts.require('GPToken');

contract('GPTCrowdsale_Capped', function (accounts) {
  const rate = new BigNumber(1000);
  const firstValue = ether.ether(40000);
  const secondValue = ether.ether(40000);
  const firstAndSecondValue = ether.ether(80000);
  const thirdValue = ether.ether(60000);
  const fourthValue = ether.ether(100000);
  const tokenSupply = new BigNumber('15e25');

  const expectedFirstTokenAmount = rate.mul(firstValue);
  const expectedSecondTokenAmount = rate.mul(firstAndSecondValue);

  const owner = accounts[0];
  const investor = accounts[1];
  const wallet = accounts[2];
  const purchaser = accounts[3];

  const walletGameSupportFund = accounts[4];
  const walletBountyProgram = accounts[5];
  const walletAdvisorsAndPartnership = accounts[6];
  const walletTeam = accounts[7];

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime.latestTime() + increaseTime.duration.weeks(1);
    this.closingTime = this.openingTime + increaseTime.duration.weeks(5);
    this.beforeClosing = this.closingTime - increaseTime.duration.days(1);

    this.token = await GPToken.new();
    this.crowdsale = await GPTCrowdsale.new(
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      walletGameSupportFund,
      walletBountyProgram,
      walletAdvisorsAndPartnership,
      walletTeam,
      this.token.address,
      { from: owner }
    );
    await this.token.transferOwnership(this.crowdsale.address);
    await this.crowdsale.addToWhitelist(owner);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(purchaser);
    await increaseTime.increaseTimeTo(this.beforeClosing);
  });

  describe('crowdsale token capped', function () {
    it('should succeed before cap', async function () {
      await this.crowdsale.buyTokens(investor, { value: firstValue, from: purchaser }).should.be.fulfilled;
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedFirstTokenAmount);
    });

    it('should succeed just before cap', async function () {
      await this.crowdsale.buyTokens(investor, { value: firstValue, from: purchaser }).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: secondValue, from: purchaser }).should.be.fulfilled;
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedSecondTokenAmount);
    });

    it('should fail just after cap', async function () {
      await this.crowdsale.buyTokens(investor, { value: firstValue, from: purchaser }).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: thirdValue, from: purchaser }).should.be.rejectedWith(EVMRevert);
    });

    it('should fail after cap', async function () {
      await this.crowdsale.buyTokens(investor, { value: fourthValue, from: purchaser }).should.be.rejectedWith(EVMRevert);
    });
  });
});
