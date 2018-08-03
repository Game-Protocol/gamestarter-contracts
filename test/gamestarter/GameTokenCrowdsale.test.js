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

const GameTokenCrowdsale = artifacts.require('GameTokenCrowdsale');
const MockGameToken = artifacts.require('MockGameToken');

/*
 * Testing GameTokenCrowdsale
 * 1. init packages
 * 2. whitelisting
 * 3. buy token with package
 */
contract('GameTokenCrowdsale', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether.ether(2);
  const value2 = ether.ether(5000);
  const tokenSupply = new BigNumber('15e25');
  const goal = ether.ether(10000);

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
  });

  describe('initialize packages', function () {

    it('should add package', async function () {
      // uint256 _startTime, uint256 _endTime, string _packageName, uint256 _minWei, uint _rate, uint _totalAmount, uint256 _totalWei 
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package1", 5, 1000, 3, ether.ether(1000)).should.be.fulfilled;
    });
  });

  // describe('purchase package', function () {
  //   beforeEach(async function () {
  //     await this.crowdsale.addBouncer(bouncerAddress, { from: owner });
  //     this.roleBouncer = await this.crowdsale.ROLE_BOUNCER();
  //     this.genSig = getSigner(this.crowdsale, bouncerAddress);
  //   });

  //   it('should have a default owner of self', async function () {
  //     const theOwner = await this.crowdsale.owner();
  //     theOwner.should.eq(owner);
  //   });
  
  //   it('should allow owner to add a bouncer', async function () {
  //     await this.crowdsale.addBouncer(bouncerAddress, { from: owner });
  //     const hasRole = await this.crowdsale.hasRole(bouncerAddress, this.roleBouncer);
  //     hasRole.should.eq(true);
  //   });

  //   it('should not allow anyone to add a bouncer', async function () {
  //     await this.crowdsale.addBouncer(bouncerAddress, { from: unauthorized }).should.be.rejected;
  //   });

  //   it('should allow valid signature for sender', async function () {
  //     await this.crowdsale.buyPackage(authorized, this.genSig(authorized), { value: value, from: authorized }).should.be.fulfilled;
  //   });
    
  //   it('should not allow invalid signature for sender', async function () {
  //     await this.crowdsale.buyPackage(authorized, 'abcd', { value: value, from: authorized }).should.be.rejected;
  //   });
  // });

  // describe('transfers', function () {
  //   beforeEach(async function () {
  //     await increaseTime.increaseTimeTo(this.openingTime);
  //   });

  //   it('should assign tokens to sender', async function () {

  //     await this.crowdsale.sendTransaction({ value: value, from: investor });
  //     let balance = await this.token.balanceOf(investor);
  //     balance.should.be.bignumber.equal(expectedTokenAmount);
  //   });
  
  //   it('should forward funds to wallet', async function () {
  //     const pre = web3.eth.getBalance(wallet);
  //     await this.crowdsale.sendTransaction({ value, from: investor });
  //     const post = web3.eth.getBalance(wallet);
  //     post.minus(pre).should.be.bignumber.equal(expectedValueAfterDeduction);
  //   });
  // });

  

  // describe('finalization', function () {
  //   beforeEach(async function () {
  //     await increaseTime.increaseTimeTo(this.afterClosingTime);
  //     await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
  //   });

  //   it('token unpaused', async function () {
  //     const paused = await this.token.paused();
  //     assert.equal(paused, false);
  //   });

  //   it('token owner transfered', async function () {
  //     const tokenOwner = await this.token.owner();
  //     assert.equal(tokenOwner, owner);
  //   });
  // });

  // describe('failed to raise goal', function () {
  //   beforeEach(async function () {
  //     await this.crowdsale.sendTransaction({ value: value, from: investor });
  //     await this.crowdsale.sendTransaction({ value: value2, from: investor2 });
  //     await increaseTime.increaseTimeTo(this.afterClosingTime);
  //     await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
  //   });

  //   it('verify refund', async function () {
  //     await this.crowdsale.claimRefund({ from: investor }).should.be.fulfilled;

  //   });
  // });
});
