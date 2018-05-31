const decodeLogs = require('../helpers/decodeLogs');
const increaseTime = require('../helpers/increaseTime');
const latestTime = require('../helpers/latestTime');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GPToken = artifacts.require('GPToken.sol');
const GPTTeamTokenTimelock = artifacts.require('GPTTeamTokenTimelock.sol');

contract('GPTTeamTokenTimelock', accounts => {
  const owner = accounts[0];
  const beneficiary = accounts[1];

  const team_tokens = new BigNumber(web3.toWei(30000000, 'ether'));

  const PART_1 = new BigNumber(web3.toWei(7500000, 'ether'));
  const PART_2 = new BigNumber(web3.toWei(15000000, 'ether'));
  const PART_3 = new BigNumber(web3.toWei(22500000, 'ether'));
  const PART_4 = new BigNumber(web3.toWei(30000000, 'ether'));


  beforeEach(async function () {
    this.token = await GPToken.new({ from: owner });
    this.releaseTime = latestTime.latestTime() + increaseTime.duration.weeks(1);
    this.timelock = await GPTTeamTokenTimelock.new(this.token.address, beneficiary, this.releaseTime);
    let transfer = await this.token.mint(this.timelock.address, team_tokens, { from: owner });
    await this.token.unpause({ from: owner });

    // first release time is right after the end of the crowdsale
    this.firstReleaseTime = this.releaseTime;
    // second release time is six months after the end of the crowdsale
    this.secondReleaseTime = this.releaseTime + increaseTime.duration.weeks(24);
    // third release time is a year after the end of the crowdsale
    this.thirdReleaseTime = this.releaseTime + increaseTime.duration.weeks(48);
    // fourth release time is a year and a half after the end of the crowdsale
    this.fourthReleaseTime = this.releaseTime + increaseTime.duration.weeks(72);
  });

  it('timelock has total tokens', async function () {
    var balance = await this.token.balanceOf(this.timelock.address);
    balance.should.be.bignumber.equal(team_tokens);
  });

  it('cannot be released before releaseTime', async function () {
    await this.timelock.release().should.be.rejected;
  });

  it('cannot be released just before time limit', async function () {
    await increaseTime.increaseTimeTo(this.releaseTime - increaseTime.duration.seconds(5));
    await this.timelock.release().should.be.rejected;
  });

  it('can be released just after limit', async function () {
    await increaseTime.increaseTimeTo(this.releaseTime + increaseTime.duration.seconds(5));
    await this.timelock.release().should.be.fulfilled;
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(PART_1);
  });

  it('can be released long after limit', async function () {
    await increaseTime.increaseTimeTo(this.releaseTime + increaseTime.duration.years(5));
    await this.timelock.release().should.be.fulfilled;
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(PART_4);
  });

  it('cannot be released after the first part already released', async function () {
    await increaseTime.increaseTimeTo(this.fourthReleaseTime + increaseTime.duration.seconds(5));
    await this.timelock.release().should.be.fulfilled;
    await this.timelock.release().should.be.rejected;
  });

  describe('released amounts', function () {

    beforeEach(async function () {
      const balance = await this.token.balanceOf(beneficiary);
      balance.should.be.bignumber.equal(0);
    });

    describe('first part', function () {
      it('just after start', async function () {
        await increaseTime.increaseTimeTo(this.firstReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_1);
      });

      it('just before end', async function () {
        await increaseTime.increaseTimeTo(this.secondReleaseTime - increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_1);
      });

      it('already released', async function () {
        await increaseTime.increaseTimeTo(this.firstReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        await this.timelock.release().should.be.rejected;
      });
    });

    describe('second part', function () {
      it('just after start', async function () {
        await increaseTime.increaseTimeTo(this.secondReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_2);
      });

      it('just before end', async function () {
        await increaseTime.increaseTimeTo(this.thirdReleaseTime - increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_2);
      });

      it('already released', async function () {
        await increaseTime.increaseTimeTo(this.secondReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        await this.timelock.release().should.be.rejected;
      });
    });

    describe('third part', function () {
      it('just after start', async function () {
        await increaseTime.increaseTimeTo(this.thirdReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_3);
      });

      it('just before end', async function () {
        await increaseTime.increaseTimeTo(this.fourthReleaseTime - increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_3);
      });

      it('already released', async function () {
        await increaseTime.increaseTimeTo(this.thirdReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        await this.timelock.release().should.be.rejected;
      });
    });

    describe('fourth part', function () {
      it('just after start', async function () {
        await increaseTime.increaseTimeTo(this.fourthReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_4);
      });

      it('long after start', async function () {
        await increaseTime.increaseTimeTo(this.fourthReleaseTime + increaseTime.duration.years(1));
        await this.timelock.release().should.be.fulfilled;
        const balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(PART_4);
      });

      it('already released', async function () {
        await increaseTime.increaseTimeTo(this.fourthReleaseTime + increaseTime.duration.seconds(5));
        await this.timelock.release().should.be.fulfilled;
        await this.timelock.release().should.be.rejected;
      });
    });
  });
});