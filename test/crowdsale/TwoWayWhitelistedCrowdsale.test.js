const ether = require('../helpers/ether');
const { signHex } = require('../helpers/sign');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .should();

const WhitelistedCrowdsale = artifacts.require('MockTwoWayWhitelistedCrowdsale');
const Token = artifacts.require('GXToken');


const getSigner = (contract, signer, data = '') => (addr) => {
  const message = contract.address.substr(2) + addr.substr(2) + data;
  return signHex(signer, message);
};

contract('TwoWayWhitelistedCrowdsale', function ([owner, wallet, authorized, unauthorized, anotherAuthorized, bouncerAddress, anyone]) {
  const rate = 1;
  const value = ether.ether(42);
  const tokenSupply = new BigNumber('1e22');

  beforeEach(async function () {
    this.token = await Token.new();
    await this.token.mint(owner, tokenSupply);
    await this.token.unpause();
    this.crowdsale = await WhitelistedCrowdsale.new(rate, wallet, this.token.address);
    await this.token.transfer(this.crowdsale.address, tokenSupply);
  });

  describe('on chain whitelisting', function () {

    describe('single user whitelisting', function () {
      beforeEach(async function () {
        await this.crowdsale.addAddressToWhitelist(authorized);
      });

      describe('accepting payments', function () {
        it('should accept payments to whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.sendTransaction({ value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(authorized, { value: value, from: unauthorized }).should.be.fulfilled;
        });

        it('should reject payments to not whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.sendTransaction({ value, from: unauthorized }).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
        });

        it('should reject payments to addresses removed from whitelist', async function () {
          await this.crowdsale.removeAddressFromWhitelist(authorized);
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
        await this.crowdsale.addAddressesToWhitelist([authorized, anotherAuthorized]);
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
          await this.crowdsale.removeAddressFromWhitelist(anotherAuthorized);
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

  describe('off chain whitelisting', function () {

    beforeEach(async function () {
      await this.crowdsale.addBouncer(bouncerAddress, { from: owner });
      this.roleBouncer = await this.crowdsale.ROLE_BOUNCER();
      this.genSig = getSigner(this.crowdsale, bouncerAddress);
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

    describe('modifiers', function () {
      it('should allow valid signature for sender', async function () {
        await this.crowdsale.buyTokensSigned(authorized, this.genSig(authorized), { value: value, from: authorized }).should.be.fulfilled;
      });
      
      it('should not allow invalid signature for sender', async function () {
        await this.crowdsale.buyTokensSigned(authorized, 'abcd', { value: value, from: authorized }).should.be.rejected;
      });

      it('should not accept invalid message for invalid user', async function () {
        await this.crowdsale.buyTokensSigned(unauthorized, 'abcd', { value: value, from: unauthorized }).should.be.rejected;
      });

      it('should not accept valid message for invalid user', async function () {
        await this.crowdsale.buyTokensSigned(unauthorized, this.genSig(authorized), { value: value, from: unauthorized }).should.be.rejected;
      });
    });
  });
});