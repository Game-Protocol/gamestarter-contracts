const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GXTCrowdsale = artifacts.require('GXTCrowdsale');
const GXToken = artifacts.require('GXToken');

contract('GXTCrowdsale_Bonuses', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether(2);
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
    await advanceBlock();
  });

  // each week we will test 3 cases:
  // 1. just after weeks start (5 sec after start)
  // 2. during the week (1 day after start)
  // 3. just before weeks end (5 sec before end)
  beforeEach(async function () {
    // opens a week from now
    this.openingTime = latestTime() + duration.weeks(1);
    // ends 5 weeks from opening time it means we can test all the bonuses from 20% to 0%
    this.closingTime = this.openingTime + duration.weeks(5);

    // tests from latest to earliest
    this.firstWeekBeforeClosing = this.closingTime - duration.weeks(1);
    this.secondWeekBeforeClosing = this.closingTime - duration.weeks(2);
    this.thirdWeekBeforeClosing = this.closingTime - duration.weeks(3);
    this.fourthWeekBeforeClosing = this.closingTime - duration.weeks(4);

    this.token = await GXToken.new();
    this.crowdsale = await GXTCrowdsale.new(
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
    await this.crowdsale.claimTokenOwnership();
    await this.crowdsale.addAddressToWhitelist(owner);
    await this.crowdsale.addAddressToWhitelist(investor);
    await this.crowdsale.addAddressToWhitelist(purchaser);
  });

  describe('bonuses', function () {
    // first week from the end
    describe('first week from the end: no bonus', function () {
      it('just after start', async function () {
        timeTo = this.firstWeekBeforeClosing + duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFirstWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.firstWeekBeforeClosing + duration.days(1);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFirstWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.closingTime - duration.seconds(1);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFirstWeekTokenAmount);
      });
    });

    describe('second week from the end: 5% bonus', function () {
      it('just after start', async function () {
        timeTo = this.secondWeekBeforeClosing + duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedSecondWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.secondWeekBeforeClosing + duration.days(1);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedSecondWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.firstWeekBeforeClosing - duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedSecondWeekTokenAmount);
      });
    });

    describe('third week from the end: 10% bonus', function () {
      it('just after start', async function () {
        timeTo = this.thirdWeekBeforeClosing + duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedThirdWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.thirdWeekBeforeClosing + duration.days(1);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedThirdWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.secondWeekBeforeClosing - duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedThirdWeekTokenAmount);
      });
    });

    describe('fourth week from the end: 15% bonus', function () {
      it('just after start', async function () {
        timeTo = this.fourthWeekBeforeClosing + duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFourthWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.fourthWeekBeforeClosing + duration.days(1);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFourthWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.thirdWeekBeforeClosing - duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFourthWeekTokenAmount);
      });
    });

    describe('fifth week from the end: 20% bonus', function () {
      it('just after start', async function () {
        timeTo = this.openingTime + duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFifthWeekTokenAmount);
      });

      it('during', async function () {
        timeTo = this.openingTime + duration.days(1);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFifthWeekTokenAmount);
      });

      it('just before end', async function () {
        timeTo = this.fourthWeekBeforeClosing - duration.seconds(5);
        await increaseTimeTo(timeTo);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedFifthWeekTokenAmount);
      });
    });
  });
});
