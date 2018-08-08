const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const expectEvent = require('../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Wagering = artifacts.require('Wagering');
const GameToken = artifacts.require('GameToken');

contract('Wagering', function ([owner, player1, player2, player3]) {

  const matchId = new BigNumber(111);
  const matchId2 = new BigNumber(222);

  const balance1 = new BigNumber(10000);
  const balance2 = new BigNumber(1000);

  const allowance1 = new BigNumber(2000);
  const allowance2 = new BigNumber(4000);

  const bet1 = new BigNumber(1000);
  const bet2 = new BigNumber(3000);
  const bet3 = new BigNumber(5000);

  before(async function () {
    await advanceBlock();
  });

  beforeEach(async function () {
    this.token = await GameToken.new("Game Token", "GT", { from: owner });
    this.wagering = await Wagering.new(this.token.address, { from: owner });
    await this.token.unpause();
  });

  describe('start match', function () {
    it('should start match', async function () {
      await this.token.mint(player1, balance1);
      await this.token.mint(player2, balance1);
      await this.token.approve(this.wagering.address, allowance1, { from: player1 });
      await this.token.approve(this.wagering.address, allowance1, { from: player2 });

      await this.wagering.matchStarted(matchId, player1, player2, bet1).should.be.fulfilled;
    });

    it('wagering contract should have the tokens after start', async function () {
      await this.token.mint(player1, balance1);
      await this.token.mint(player2, balance1);
      await this.token.approve(this.wagering.address, allowance1, { from: player1 });
      await this.token.approve(this.wagering.address, allowance1, { from: player2 });

      await this.wagering.matchStarted(matchId, player1, player2, bet1).should.be.fulfilled;
      const balance = await this.token.balanceOf(this.wagering.address);
      balance.should.be.bignumber.equal(bet1.mul(2));
    });

    it('should not start when one player does not have enough tokens', async function () {
      await this.token.mint(player1, balance1);
      await this.token.mint(player2, balance2);
      await this.token.approve(this.wagering.address, allowance2, { from: player1 });
      await this.token.approve(this.wagering.address, allowance2, { from: player2 });

      await this.wagering.matchStarted(matchId, player1, player2, bet2).should.be.rejected;
    });

    it('should not start when both players do not have enough tokens', async function () {
      await this.token.mint(player1, balance1);
      await this.token.mint(player2, balance1);
      await this.token.approve(this.wagering.address, allowance2, { from: player1 });
      await this.token.approve(this.wagering.address, allowance2, { from: player2 });

      await this.wagering.matchStarted(matchId, player1, player2, bet3).should.be.rejected;
    });

    it('should not start when player allowance is too low', async function () {
      await this.token.mint(player1, balance2);
      await this.token.mint(player2, balance2);
      await this.token.approve(this.wagering.address, allowance2, { from: player1 });
      await this.token.approve(this.wagering.address, allowance2, { from: player2 });

      await this.wagering.matchStarted(matchId, player1, player2, bet2).should.be.rejected;
    });

    it('should not start when a match with the same match id already finished', async function () {
      await this.token.mint(player1, balance1);
      await this.token.mint(player2, balance1);
      await this.token.approve(this.wagering.address, allowance1, { from: player1 });
      await this.token.approve(this.wagering.address, allowance1, { from: player2 });

      await this.wagering.matchStarted(matchId, player1, player2, bet1).should.be.fulfilled;
      await this.wagering.matchStarted(matchId, player1, player2, bet2).should.be.rejected;
    });
  });

  describe('end match', function () {
    beforeEach(async function () {
      await this.token.mint(player1, balance1);
      await this.token.mint(player2, balance1);
      await this.token.approve(this.wagering.address, allowance1, { from: player1 });
      await this.token.approve(this.wagering.address, allowance1, { from: player2 });
      await this.wagering.matchStarted(matchId, player1, player2, bet1);
    });

    it('should end match', async function () {
      await this.wagering.matchEnded(matchId, player1).should.be.fulfilled;
    });  

    it('winner should recieve the winning amount', async function () {
      const balanceBefore = await this.token.balanceOf(player1);
      await this.wagering.matchEnded(matchId, player1).should.be.fulfilled;

      const balanceAfter = await this.token.balanceOf(player1);
      balanceAfter.should.be.bignumber.equal(balanceBefore.add(bet1.mul(2)));
    });

    it('wagering contract should lose the bet tokens after the winner got his tokens', async function () {
      const balanceBefore = await this.token.balanceOf(this.wagering.address);
      await this.wagering.matchEnded(matchId, player1).should.be.fulfilled;

      const balanceAfter = await this.token.balanceOf(this.wagering.address);
      balanceAfter.should.be.bignumber.equal(balanceBefore.sub(bet1.mul(2)));
    });

    it('should create an event when match is finished', async function () {
      const receipt = await this.wagering.matchEnded(matchId, player1).should.be.fulfilled;

      await expectEvent.inLogs(receipt.logs, 'MatchEnded');
    });

    it('should fail when trying to end a unstarted match', async function () {
      await this.wagering.matchEnded(matchId2, player1).should.be.rejected;
    });

    it('should fail when winner is not one of the players', async function () {
      await this.wagering.matchEnded(matchId, player3).should.be.rejected;
    });

    it('should return bet to players in case of draw (winner is 0x0)', async function () {
      const player1BalanceBefore = await this.token.balanceOf(player1);
      const player2BalanceBefore = await this.token.balanceOf(player2);
      await this.wagering.matchEnded(matchId, "0x0").should.be.fulfilled;

      const player1BalanceAfter = await this.token.balanceOf(player1);
      const player2BalanceAfter = await this.token.balanceOf(player2);

      player1BalanceAfter.should.be.bignumber.equal(player1BalanceBefore.add(bet1));
      player2BalanceAfter.should.be.bignumber.equal(player2BalanceBefore.add(bet1));
    });
  });

  describe('refund after match timeout', function () {
    beforeEach(async function () {
      await this.token.mint(player1, balance1);
      await this.token.mint(player2, balance1);
      await this.token.approve(this.wagering.address, allowance1, { from: player1 });
      await this.token.approve(this.wagering.address, allowance1, { from: player2 });
      await this.wagering.matchStarted(matchId, player1, player2, bet1);
    });

    it('wagering contract has twice the bet amount', async function () {
      const balance = await this.token.balanceOf(this.wagering.address);
      balance.should.be.bignumber.equal(bet1.mul(2));
    });

    it('refund after 1 hour', async function () {
      afterTimeout = latestTime() + duration.minutes(61);
      await increaseTimeTo(afterTimeout);
      await this.wagering.refundMatch(matchId).should.be.fulfilled;
    });

    it('should transfer the bet back to players', async function () {
      const player1BalanceBefore = await this.token.balanceOf(player1);
      const player2BalanceBefore = await this.token.balanceOf(player2);

      afterTimeout = latestTime() + duration.minutes(61);
      await increaseTimeTo(afterTimeout);
      await this.wagering.refundMatch(matchId).should.be.fulfilled;

      const player1BalanceAfter = await this.token.balanceOf(player1);
      const player2BalanceAfter = await this.token.balanceOf(player2);

      player1BalanceAfter.should.be.bignumber.equal(player1BalanceBefore.add(bet1));
      player2BalanceAfter.should.be.bignumber.equal(player2BalanceBefore.add(bet1));
    });

    it('should fail before 1 hour', async function () {
      afterTimeout = latestTime() + duration.minutes(59);
      await increaseTimeTo(afterTimeout);
      await this.wagering.refundMatch(matchId).should.be.rejected;
    });
  });
});