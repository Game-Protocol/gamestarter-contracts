const decodeLogs = require('../helpers/decodeLogs');
const SmartToken = artifacts.require('GXToken.sol');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SmartToken', accounts => {
  it('verifies the token name, symbol and decimal units after construction', async () => {
    let token = await SmartToken.new();
    let name = await token.name.call();
    name.should.be.equal("Game Protocol Token");
    let symbol = await token.symbol.call();
    symbol.should.be.equal("GXT");
    let decimals = await token.decimals.call();
    decimals.should.be.bignumber.equal(18);
  });

  it('verifies that the owner can enable & re-disable transfers', async () => {
    let token = await SmartToken.new();
    await token.disableTransfers(false);
    let paused = await token.paused.call();
    paused.should.be.equal(false);
    await token.disableTransfers(true);
    paused = await token.paused.call();
    paused.should.be.equal(true);
  });

  it('should throw when a non owner attempts to disable transfers', async () => {
    let token = await SmartToken.new();
    await token.disableTransfers(false, {
      from: accounts[1]
    }).should.be.rejected;
  });

  it('verifies that issue tokens updates the target balance and the total supply', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[1], 100);
    let totalSupply = await token.totalSupply.call();
    totalSupply.should.be.bignumber.equal(100);
    let balance = await token.balanceOf.call(accounts[1]);
    balance.should.be.bignumber.equal(100);
  });

  it('verifies that the owner can issue tokens', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[1], 100);
    let balance = await token.balanceOf.call(accounts[1]);
    balance.should.be.bignumber.equal(100);
  });

  it('verifies that the owner can issue tokens to his/her own account', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[0], 100);
    let balance = await token.balanceOf.call(accounts[0]);
    balance.should.be.bignumber.equal(100);
  });

  it('should throw when the owner attempts to issue tokens to an invalid address', async () => {
    let token = await SmartToken.new();
    await token.issue('0x0', 100).should.be.rejected;
  });

  it('should throw when the owner attempts to issue tokens to the token address', async () => {
    let token = await SmartToken.new();
    await token.issue(token.address, 100).should.be.rejected;
  });

  it('should throw when a non owner attempts to issue tokens', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[1], 100, {
      from: accounts[2]
    }).should.be.rejected;
  });

  it('verifies that destroy tokens updates the target balance and the total supply', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[1], 100);
    await token.destroy(accounts[1], 20);
    let totalSupply = await token.totalSupply.call();
    totalSupply.should.be.bignumber.equal(80);
    let balance = await token.balanceOf.call(accounts[1]);
    balance.should.be.bignumber.equal(80);
  });

  it('verifies that the owner can destroy tokens', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[1], 100);
    await token.destroy(accounts[1], 20);
    let balance = await token.balanceOf.call(accounts[1]);
    balance.should.be.bignumber.equal(80);
  });

  it('verifies that the owner can destroy tokens from his/her own account', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[0], 100);
    await token.destroy(accounts[0], 20);
    let balance = await token.balanceOf.call(accounts[0]);
    balance.should.be.bignumber.equal(80);
  });

  it('verifies that a holder can destroy tokens from his/her own account', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[1], 100);
    await token.destroy(accounts[1], 20);
    let balance = await token.balanceOf.call(accounts[1]);
    balance.should.be.bignumber.equal(80);
  });

  it('should throw when a non owner attempts to destroy tokens', async () => {
    let token = await SmartToken.new();
    await token.issue(accounts[1], 100);
    await token.destroy(accounts[1], 20, {
      from: accounts[2]
    }).should.be.rejected;
  });

  it('verifies the balances after a transfer', async () => {
    let token = await SmartToken.new();
    await token.disableTransfers(false);
    await token.issue(accounts[0], 10000);
    await token.transfer(accounts[1], 500);
    let balance;
    balance = await token.balanceOf.call(accounts[0]);
    balance.should.be.bignumber.equal(9500);
    balance = await token.balanceOf.call(accounts[1]);
    balance.should.be.bignumber.equal(500);
  });

  it('should throw when attempting to transfer while transfers are disabled', async () => {
    let token = await SmartToken.new();
    await token.disableTransfers(false);
    await token.issue(accounts[0], 1000);
    let balance = await token.balanceOf.call(accounts[0]);
    balance.should.be.bignumber.equal(1000);
    await token.transfer(accounts[1], 100);
    await token.disableTransfers(true);
    let paused = await token.paused.call();
    paused.should.be.equal(true);

    await token.transfer(accounts[1], 100).should.be.rejected;
  });

  it('verifies the allowance after an approval', async () => {
    let token = await SmartToken.new();
    await token.disableTransfers(false);
    await token.issue(accounts[0], 10000);
    await token.approve(accounts[1], 500);
    let allowance = await token.allowance.call(accounts[0], accounts[1]);
    allowance.should.be.bignumber.equal(500);
  });

  it('should throw when attempting to transfer from while transfers are disabled', async () => {
    let token = await SmartToken.new();
    await token.disableTransfers(false);
    await token.issue(accounts[0], 1000);
    let balance = await token.balanceOf.call(accounts[0]);
    balance.should.be.bignumber.equal(1000);
    await token.approve(accounts[1], 500);
    let allowance = await token.allowance.call(accounts[0], accounts[1]);
    allowance.should.be.bignumber.equal(500);
    await token.transferFrom(accounts[0], accounts[2], 50, {
      from: accounts[1]
    });
    await token.disableTransfers(true);
    let paused = await token.paused.call();
    paused.should.be.equal(true);

    await token.transferFrom(accounts[0], accounts[2], 50, {
      from: accounts[1]
    }).should.be.rejected;
  });
});