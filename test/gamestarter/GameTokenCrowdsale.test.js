const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { ether } = require('../helpers/ether');
const { signHex } = require('../helpers/sign');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GameTokenCrowdsale = artifacts.require('GameTokenCrowdsale');
const MockGameToken = artifacts.require('MockGameToken');

const getSigner = (contract, signer, data = '') => (addr) => {
  const message = contract.address.substr(2) + addr.substr(2) + data;
  return signHex(signer, message);
};

/*
 * Testing GameTokenCrowdsale
 * 1. init packages
 * 2. whitelisting
 * 3. buy token with package
 */
contract('GameTokenCrowdsale', function ([owner, authorized, unauthorized, wallet, feeWallet, bouncerAddress]) {
  const rate = new BigNumber(1000);
  const value = ether(2);
  const value2 = ether(5000);
  const tokenSupply = new BigNumber('15e25');
  const goal = ether(10000);

  const expectedFeeAmount = value.mul(0.05);
  const expectedValueAfterDeduction = value.mul(0.95);
  const expectedTokenAmount = value.mul(rate);

  const feePercent = new BigNumber(5);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(5);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
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
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package", 5, 1000, 3, ether(1000)).should.be.fulfilled;
    });

    it('should not add if sender is not the owner', async function () {
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package", 5, 1000, 3, ether(1000), { from: wallet}).should.be.rejected;
    });

    it('should not add if end date is passed', async function () {
      await increaseTimeTo(this.closingTime);
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package", 5, 1000, 3, ether(1000)).should.be.rejected;
    });

    it('should not add if totalAmount is zero', async function () {
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package", 5, 1000, 0, ether(1000)).should.be.rejected;
    });

    it('should not add if totalWei is zero', async function () {
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package", 5, 1000, 3, ether(0)).should.be.rejected;
    });

    it('should get package', async function () {
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package1", 5, 1000, 3, ether(1000));
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package2", 5, 1000, 3, ether(1000));
      const packageCount = await this.crowdsale.packageCount();
      // console.log("packageCount: " + packageCount);
      for (i = 0; i < packageCount; i++) { 
        const package = await this.crowdsale.packages(i);
        [id, _, _, name, _]  = package;
        // console.log("IDX: " + id);
        id.should.be.bignumber.equal(new BigNumber(i));
        // console.log("name: " + name);
        // console.log("Package: " + package);
      }
    });
  });

  describe('whitelisting off chain', function () {
    beforeEach(async function () {
      await this.crowdsale.addBouncer(bouncerAddress, { from: owner });
      this.roleBouncer = await this.crowdsale.ROLE_BOUNCER();
      this.genSig = getSigner(this.crowdsale, bouncerAddress);

      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package1", 5, 1000, 3, ether(1000));
      await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package2", 5, 1000, 3, ether(1000));

      await increaseTimeTo(this.openingTime);
    });

    it('should have a default owner of self', async function () {
      const theOwner = await this.crowdsale.owner();
      theOwner.should.eq(owner);
    });
  
    it('should allow owner to add a bouncer', async function () {
      await this.crowdsale.addBouncer(bouncerAddress, { from: owner });
      const hasRole = await this.crowdsale.hasRole(bouncerAddress, this.roleBouncer);
      hasRole.should.eq(true);
    });

    it('should not allow anyone to add a bouncer', async function () {
      await this.crowdsale.addBouncer(bouncerAddress, { from: unauthorized }).should.be.rejected;
    });

    it('should allow valid signature for sender', async function () {
      await this.crowdsale.buyPackage(authorized, 0, this.genSig(authorized), { value: value, from: authorized }).should.be.fulfilled;
    });
    
    it('should not allow invalid signature for sender', async function () {
      await this.crowdsale.buyPackage(authorized, 0, 'abcd', { value: value, from: authorized }).should.be.rejected;
    });
  });

  // describe('transfers', function () {
  //   beforeEach(async function () {
  //     await this.crowdsale.addPackage(this.openingTime, this.closingTime, "Package1", 5, 1000, 3, ether(1000));
  //     await increaseTimeTo(this.openingTime);
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

  

  describe('finalization', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });

    it('token unpaused', async function () {
      const paused = await this.token.paused();
      assert.equal(paused, false);
    });

    it('token owner transfered', async function () {
      const tokenOwner = await this.token.owner();
      assert.equal(tokenOwner, owner);
    });
  });

  // describe('failed to raise goal', function () {
  //   beforeEach(async function () {
  //     await this.crowdsale.sendTransaction({ value: value, from: investor });
  //     await this.crowdsale.sendTransaction({ value: value2, from: investor2 });
  //     await increaseTimeTo(this.afterClosingTime);
  //     await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
  //   });

  //   it('verify refund', async function () {
  //     await this.crowdsale.claimRefund({ from: investor }).should.be.fulfilled;

  //   });
  // });
});
