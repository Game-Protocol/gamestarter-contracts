const decodeLogs = require('../helpers/decodeLogs');
const MockSmartToken = artifacts.require('MockSmartToken');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('MockSmartToken', accounts => {
  let token;
  const creator = accounts[0];

  beforeEach(async function () {
    token = await MockSmartToken.new("Smart Token", "MST", { from: creator });
    await token.mint(creator, 150*10**6*10**18);
  });

  it('has a name', async function () {
    const name = await token.name();
    assert.equal(name, "Smart Token");
  });

  it('has a symbol', async function () {
    const symbol = await token.symbol();
    assert.equal(symbol, "MST");
  });

  it('has 18 decimals', async function () {
    const decimals = await token.decimals();
    assert(decimals.eq(18));
  });

  it("cant transfer when paused", async function() {
    await token.pause().should.be.fulfilled;
    await token.transfer(accounts[1], 100*10**6*10**18).should.be.rejected;
  });

  it("should return correct balances after transfer", async function() {
    let transfer = await token.transfer(accounts[1], 100*10**6*10**18);

    let firstAccountBalance = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalance, 50*10**6*10**18);

    let secondAccountBalance = await token.balanceOf(accounts[1]);
    assert.equal(secondAccountBalance, 100*10**6*10**18);
  });
});