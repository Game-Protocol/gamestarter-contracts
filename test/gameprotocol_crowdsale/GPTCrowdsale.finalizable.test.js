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

contract('GPTCrowdsale_Finalizable', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether.ether(2);
  const tokenSupply = new BigNumber('15e25');
  const expectedTokenAmount = rate.mul(value).mul(1.2);

  const owner = accounts[0];
  const thirdparty = accounts[1];
  const wallet = accounts[2];

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
  });

  describe('finalizable crowdsale', function () {
    it('cannot be finalized before ending', async function () {
      await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
    });
  
    it('cannot be finalized by third party after ending', async function () {
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: thirdparty }).should.be.rejectedWith(EVMRevert);
    });
  
    it('can be finalized by owner after ending', async function () {
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });
  
    it('cannot be finalized twice', async function () {
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner });
      await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
    });
  
    it('logs finalized', async function () {
      await increaseTime.increaseTimeTo(this.afterClosingTime);
      const { logs } = await this.crowdsale.finalize({ from: owner });
      const event = logs.find(e => e.event === 'Finalized');
      should.exist(event);
    });
  });
});
