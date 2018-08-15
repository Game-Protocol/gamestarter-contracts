const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { ether } = require('../helpers/ether');
const expectEvent = require('../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Factory = artifacts.require('GameStarterFactory');
const Token = artifacts.require('GameToken');


contract('GameStarterFactory', function ([owner, developer, feeWallet]) {
  const rate = new BigNumber(1);
  const goal = ether(50);
  const feePercent = new BigNumber(5);


  before(async function () {
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
  });

  it('should create a factory', async function () {
    this.factory = await Factory.new(feeWallet, feePercent).should.be.fulfilled;
  });

  it('should create game', async function () {
    await this.factory.createGame(developer, "Test Test Test", "TTT", goal, this.openingTime, this.closingTime, rate).should.be.fulfilled;
  });

  describe('create game', function () {
    beforeEach(async function () {
      this.receipt = await this.factory.createGame(developer, "Test Game Token", "TGT", goal, this.openingTime, this.closingTime, rate);
    });

    it('should log event "NewGame"', async function () {
      await expectEvent.inLogs(this.receipt.logs, 'NewGame');
    });
  });
});