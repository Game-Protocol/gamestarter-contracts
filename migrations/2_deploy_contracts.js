var verifyCode = require('../scripts/verifyCode');
var toTimestamp = require('../scripts/toTimestamp');

var GPToken = artifacts.require("./GPToken.sol");
var GPTCrowdsale = artifacts.require("./GPTCrowdsale.sol");


module.exports = function (deployer) {
  var wallet = process.env.WALLET;
  var feeWallet = process.env.FEEWALLET;
  var team = process.env.TEAM;
  var advisors = process.env.ADVISORS;
  var bountyProgram = process.env.BOUNTYPROGRAM;
  var gameSupportFund = process.env.GAMESUPPORTFUND;

  var start = toTimestamp.getTimeStampMinutesFromNow(5); 
  var end = toTimestamp.getTimeStampMinutesFromNow(10);
  // var start = toTimestamp.getTimeStamp('2018-08-01 12:00:00');
  // var end = toTimestamp.getTimeStamp('2018-09-15 12:00:00');
  console.log(start + " - " + end);

  var rate = new web3.BigNumber(2000); // exchange rate

  verifyCode.flatten();

  deployer.deploy(GPToken).then(function () {
    var types = ["uint256" ,"uint256" ,"uint256" ,"address" ,"address" ,"address" ,"address" , "address" , "address"];
    var params = [start, end, rate, wallet, gameSupportFund, bountyProgram, advisors, team, GPToken.address];
    verifyCode.toABI("GPTCrowdsale.abi.txt", types, params);
    deployer.deploy(GPTCrowdsale, start, end, rate, wallet, gameSupportFund, bountyProgram, advisors, team, GPToken.address).then(function (){
      GPToken.deployed().then(function (instance){
        instance.transferOwnership(GPTCrowdsale.address); // Transfer ownership to crowdsale
      });
    });
  });
};