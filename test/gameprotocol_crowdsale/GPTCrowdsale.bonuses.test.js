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

contract('GPTCrowdsale_Bonuses', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether.ether(2);
  const tokenSupply = new BigNumber('15e25');

  const expectedFirstWeekTokenAmount = rate.mul(value);
  const expectedSecondWeekTokenAmount = rate.mul(value).mul(1.05);
  const expectedThirdWeekTokenAmount = rate.mul(value).mul(1.1);
  const expectedFourthWeekTokenAmount = rate.mul(value).mul(1.15);
  const expectedFifthWeekTokenAmount = rate.mul(value).mul(1.2);

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

  // each week we will test 3 cases:
  // 1. just after weeks start (5 sec after start)
  // 2. during the week (1 day after start)
  // 3. just before weeks end (5 sec before end)
  beforeEach(async function () {
    // opens a week from now
    this.openingTime = latestTime.latestTime() + increaseTime.duration.weeks(1);
    // ends 5 weeks from opening time it means we can test all the bonuses from 20% to 0%
    this.closingTime = this.openingTime + increaseTime.duration.weeks(5);

    // tests from latest to earliest
    this.firstWeekBeforeClosing = this.closingTime - increaseTime.duration.weeks(1);
    this.secondWeekBeforeClosing = this.closingTime - increaseTime.duration.weeks(2);
    this.thirdWeekBeforeClosing = this.closingTime - increaseTime.duration.weeks(3);
    this.fourthWeekBeforeClosing = this.closingTime - increaseTime.duration.weeks(4);

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
  });

  describe('bonuses', function () {
    // first week from the end
    describe('first week from the end: no bonus', function () {
      it('just after start', async function () {
        timeTo = this.firstWeekBeforeClosing + increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFirstWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.firstWeekBeforeClosing + increaseTime.duration.days(1);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFirstWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.closingTime - increaseTime.duration.seconds(1);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFirstWeekTokenAmount);
      });
    });

    describe('second week from the end: 5% bonus', function () {
      it('just after start', async function () {
        timeTo = this.secondWeekBeforeClosing + increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedSecondWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.secondWeekBeforeClosing + increaseTime.duration.days(1);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedSecondWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.firstWeekBeforeClosing - increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedSecondWeekTokenAmount);
      });
    });

    describe('third week from the end: 10% bonus', function () {
      it('just after start', async function () {
        timeTo = this.thirdWeekBeforeClosing + increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedThirdWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.thirdWeekBeforeClosing + increaseTime.duration.days(1);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedThirdWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.secondWeekBeforeClosing - increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedThirdWeekTokenAmount);
      });
    });

    describe('fourth week from the end: 15% bonus', function () {
      it('just after start', async function () {
        timeTo = this.fourthWeekBeforeClosing + increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFourthWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.fourthWeekBeforeClosing + increaseTime.duration.days(1);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFourthWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.thirdWeekBeforeClosing - increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFourthWeekTokenAmount);
      });
    });

    describe('fifth week from the end: 20% bonus', function () {
      it('just after start', async function () {
        timeTo = this.openingTime + increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFifthWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.openingTime + increaseTime.duration.days(1);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFifthWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.fourthWeekBeforeClosing - increaseTime.duration.seconds(5);
        await increaseTime.increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFifthWeekTokenAmount);
      });
    });
  });
});
