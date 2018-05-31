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

contract('GPTCrowdsale_Timed', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether.ether(2);
  const tokenSupply = new BigNumber('15e25');
  const expectedTokenAmount = rate.mul(value).mul(1.2);

  const owner = accounts[0];
  const investor = accounts[1];
  const wallet = accounts[2];
  const purchaser = accounts[3];

  const walletGameSupportFund = accounts[4];
  const walletBountyProgram = accounts[5];
  const walletAdvisorsAndPartnership = accounts[6];
  const walletTeam = accounts[7];

  const authorized = investor;
  const unauthorized = accounts[8]
  const anotherAuthorized = accounts[9];

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime.latestTime() + increaseTime.duration.weeks(1);
    this.closingTime = this.openingTime + increaseTime.duration.weeks(5);
    this.afterClosingTime = this.closingTime + increaseTime.duration.seconds(1);
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

  //  Timed ---------------------------------------------------------------------------
  describe('timed crowdsale', function () {
    it('should be ended only after end', async function () {
      let ended = await this.crowdsale.hasClosed();
      ended.should.equal(false);
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      ended = await this.crowdsale.hasClosed();
      ended.should.equal(true);
    });

    describe('accepting payments', function () {
      it('should reject payments before start', async function () {
        await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(EVMRevert);
      });

      it('should accept payments after start', async function () {
        await increaseTime.increaseTimeTo(this.openingTime);
        await this.crowdsale.send(value).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
      });

      it('should reject payments after end', async function () {
        await increaseTime.increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(EVMRevert);
      });
    });
  });
  // Timed ---------------------------------------------------------------------------
});
