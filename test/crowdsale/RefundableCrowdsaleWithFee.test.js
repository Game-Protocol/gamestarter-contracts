const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const Crowdsale = artifacts.require('RefundableCrowdsaleWithFeeImpl');
const Token = artifacts.require('MockTestToken');


contract('RefundableCrowdsaleWithFee', function ([owner, wallet, feeWallet, investor]) {
  const rate = new BigNumber(1);
  const feePercent = new BigNumber(5);
  const goal = ether(50);
  const lessThanGoal = ether(45);


  before(async function () {
      await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await Token.new();
    this.crowdsale = await Crowdsale.new(this.openingTime, this.closingTime, rate, wallet, this.token.address, goal, feeWallet, feePercent);
    this.token.transferOwnership(this.crowdsale.address);
  });

  describe('creating a valid crowdsale', function () {
    it('should fail with zero goal', async function () {
      await Crowdsale.new(this.openingTime, this.closingTime, rate, wallet, this.token.address, 0, feeWallet, feePercent).should.be.rejected;
    });
  });

  describe('refunds', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });

    it('should deny refunds before end', async function () {
      await this.crowdsale.sendTransaction({ value: goal, from: investor });
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejected;
    });
  
    it('should deny refunds after end if goal was reached', async function () {
      await this.crowdsale.sendTransaction({ value: goal, from: investor });
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejected;
    });
  
    it('should allow refunds after end if goal was not reached', async function () {
      await this.crowdsale.sendTransaction({ value: lessThanGoal, from: investor });
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner });
      const pre = web3.eth.getBalance(investor);
      await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 });
      const post = web3.eth.getBalance(investor);
      post.minus(pre).should.be.bignumber.equal(lessThanGoal);
    });
  
    it('should forward funds to wallet after end if goal was reached', async function () {
      await this.crowdsale.sendTransaction({ value: goal, from: investor });
      await increaseTimeTo(this.afterClosingTime);
      const pre = web3.eth.getBalance(wallet);
      const prefee = web3.eth.getBalance(feeWallet);
      await this.crowdsale.finalize({ from: owner });
      const post = web3.eth.getBalance(wallet);
      const postfee = web3.eth.getBalance(feeWallet);
      post.minus(pre).should.be.bignumber.equal(goal.sub(goal.mul(feePercent.div(100))));
      postfee.minus(prefee).should.be.bignumber.equal(goal.mul(feePercent.div(100)));
    });
  });
});