const advanceBlock = require('../../helpers/advanceToBlock');
const increaseTime = require('../../helpers/increaseTime');
const latestTime = require('../../helpers/latestTime');
const ether = require('../../helpers/ether');
const EVMRevert = "revert";

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const StandardCrowdsale = artifacts.require('StandardCrowdsale');
const SubToken = artifacts.require('SubToken');

contract('StandardCrowdsale_Minted', function (accounts) {
  const rate = new BigNumber(1000);
  const value = ether.ether(2);
  const tokenSupply = new BigNumber('15e25');
  const expectedTokenAmount = rate.mul(value);

  const owner = accounts[0];
  const investor = accounts[1];
  const wallet = accounts[2];
  const purchaser = accounts[3];
  const feeWallet = accounts[4];

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime.latestTime() + increaseTime.duration.weeks(1);
    this.closingTime = this.openingTime + increaseTime.duration.weeks(5);
    this.afterClosingTime = this.closingTime + increaseTime.duration.seconds(1);
    this.token = await SubToken.new();
    this.crowdsale = await StandardCrowdsale.new(
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      feeWallet,
      this.token.address,
      { from: owner }
    );
    await this.token.transferOwnership(this.crowdsale.address);
  });

  describe('minting tests', function () {
    beforeEach(async function () {
      await increaseTime.increaseTimeTo(this.openingTime);
      // await this.crowdsale.addToWhitelist(owner);
      // await this.crowdsale.addToWhitelist(investor);
      // await this.crowdsale.addToWhitelist(purchaser);
    });

    describe('accepting payments', function () {
      it('should be token owner', async function () {
        const owner = await this.token.owner();
        owner.should.equal(this.crowdsale.address);
      });

      it('should accept payments', async function () {
        await this.crowdsale.send(value).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
      });
    });

    describe('high-level purchase', function () {
      it('should log purchase', async function () {
        const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
        const event = logs.find(e => e.event === 'TokenPurchase');
        should.exist(event);
        event.args.purchaser.should.equal(investor);
        event.args.beneficiary.should.equal(investor);
        event.args.value.should.be.bignumber.equal(value);
        event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
      });

      it('should assign tokens to sender', async function () {
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(expectedTokenAmount);
      });

      it('should forward funds to wallet', async function () {
        const pre = web3.eth.getBalance(wallet);
        const preFee = web3.eth.getBalance(feeWallet);
        await this.crowdsale.sendTransaction({ value, from: investor });
        const post = web3.eth.getBalance(wallet);
        const postFee = web3.eth.getBalance(feeWallet);
        const walletChangedAmount = post.minus(pre);
        const feeWalletChangedAmount = postFee.minus(preFee);
        walletChangedAmount.add(feeWalletChangedAmount).should.be.bignumber.equal(value);
      });
    });
  });
});
