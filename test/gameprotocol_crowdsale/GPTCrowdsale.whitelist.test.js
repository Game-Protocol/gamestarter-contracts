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

contract('GPTCrowdsale_Whitelist', function (accounts) {
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
  });

  describe('whitelisting', function () {
    beforeEach(async function () {
      await increaseTime.increaseTimeTo(this.openingTime);
    });

    describe('single user whitelisting', function () {
      beforeEach(async function () {
        await this.crowdsale.addToWhitelist(authorized);
      });

      describe('accepting payments', function () {
        it('should accept payments to whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(authorized, { value: value, from: unauthorized }).should.be.fulfilled;
        });

        it('should reject payments to not whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.send(value).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
        });

        it('should reject payments to addresses removed from whitelist', async function () {
          await this.crowdsale.removeFromWhitelist(authorized);
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.rejected;
        });
      });

      describe('reporting whitelisted', function () {
        it('should correctly report whitelisted addresses', async function () {
          let isAuthorized = await this.crowdsale.whitelist(authorized);
          isAuthorized.should.equal(true);
          let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
          isntAuthorized.should.equal(false);
        });
      });
    });

    describe('many user whitelisting', function () {
      beforeEach(async function () {
        await this.crowdsale.addManyToWhitelist([authorized, anotherAuthorized]);
      });

      describe('accepting payments', function () {
        it('should accept payments to whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(authorized, { value: value, from: unauthorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: unauthorized }).should.be.fulfilled;
        });

        it('should reject payments to not whitelisted (with whichever buyers)', async function () {
          await this.crowdsale.send(value).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
        });

        it('should reject payments to addresses removed from whitelist', async function () {
          await this.crowdsale.removeFromWhitelist(anotherAuthorized);
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.rejected;
        });
      });

      describe('reporting whitelisted', function () {
        it('should correctly report whitelisted addresses', async function () {
          let isAuthorized = await this.crowdsale.whitelist(authorized);
          isAuthorized.should.equal(true);
          let isAnotherAuthorized = await this.crowdsale.whitelist(anotherAuthorized);
          isAnotherAuthorized.should.equal(true);
          let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
          isntAuthorized.should.equal(false);
        });
      });
    });
  });
});
