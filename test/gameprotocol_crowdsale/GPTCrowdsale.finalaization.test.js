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

contract('GPTCrowdsale_Finalazation', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether.ether(2);
  const tokenSupply = new BigNumber('15e25');

  const expectedGameSupportTokenAmount = tokenSupply.mul(0.1);
  const expectedGameSupportWithUnsoldTokenAmount = tokenSupply.mul(0.68);
  const expectedBountyProgramTokenAmount = tokenSupply.mul(0.02);
  const expectedAdvisorsTokenAmount = tokenSupply.mul(0.1);
  const expectedTeamTokenAmount = tokenSupply.mul(0.2);

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
    await this.crowdsale.addToWhitelist(investor);
  });

  describe('finalization', function () {
    it('finalization done', async function () {
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });

    describe('bonuses', function () {
      beforeEach(async function () {
        await increaseTime.increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
      });

      it('tokens delivered to game support fund', async function () {
        let balance = await this.token.balanceOf(walletGameSupportFund);
        balance.should.be.bignumber.equal(expectedGameSupportWithUnsoldTokenAmount);
      });

      it('tokens delivered to bounty program', async function () {
        let balance = await this.token.balanceOf(walletBountyProgram);
        balance.should.be.bignumber.equal(expectedBountyProgramTokenAmount);
      });

      it('tokens delivered to advisors', async function () {
        let balance = await this.token.balanceOf(walletAdvisorsAndPartnership);
        balance.should.be.bignumber.equal(expectedAdvisorsTokenAmount);
      });

      // it('tokens delivered to team', async function () {
      //   let balance = await this.token.balanceOf(walletTeam);
      //   balance.should.be.bignumber.equal(expectedTeamTokenAmount);
      // });

      it('finished minting', async function () {
        const mintingFinished = await this.token.mintingFinished.call();
        assert.equal(mintingFinished, true);
      });

      it('cant mint more', async function () {
        await this.token.mint(owner, value, { from: owner }).should.be.rejectedWith(EVMRevert);
      });

      it('token unpaused', async function () {
        const paused = await this.token.paused();
        assert.equal(paused, false);
      });

      it('sending token', async function () {
        await this.token.transfer(investor, 100, { from: walletGameSupportFund }).should.be.fulfilled;
      });

      it('token owner transfered', async function () {
        const tokenOwner = await this.token.owner();
        assert.equal(tokenOwner, owner);
      });
    });
  });
});
