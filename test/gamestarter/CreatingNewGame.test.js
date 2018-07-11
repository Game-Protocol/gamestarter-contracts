const advanceBlock = require('../helpers/advanceToBlock');
const increaseTime = require('../helpers/increaseTime');
const latestTime = require('../helpers/latestTime');
const ether = require('../helpers/ether');
const EVMRevert = "revert";

const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const GameToken = artifacts.require('GameToken');

contract('CreatingNewGame', function (accounts) {

    before(async function () {
        await advanceBlock.advanceBlock();
    });

    beforeEach(async function () {
        
    });

});