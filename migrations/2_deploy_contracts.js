var timestamp = require('../scripts/timestamp');

var GXToken = artifacts.require("GXToken");
var GXTCrowdsale = artifacts.require("GXTCrowdsale");

module.exports = async deployer => {
  var wallet = process.env.WALLET;
  var feeWallet = process.env.FEEWALLET;
  var team = process.env.TEAM;
  var advisors = process.env.ADVISORS;
  var bountyProgram = process.env.BOUNTYPROGRAM;
  var gameSupportFund = process.env.GAMESUPPORTFUND;

  var start = timestamp.getTimeStampMinutesFromNow(5); 
  var end = timestamp.getTimeStampMinutesFromNow(10);
  // var start = timestamp.getTimeStamp('2018-08-01 12:00:00');
  // var end = timestamp.getTimeStamp('2018-09-15 12:00:00');
  console.log(timestamp.timestampToDate(start) + " - " + timestamp.timestampToDate(end));

  var rate = new web3.BigNumber(2000); // exchange rate

  await deployer.deploy(GXToken);
  var types = ["uint256" ,"uint256" ,"uint256" ,"address" ,"address" ,"address" ,"address" , "address" , "address"];
  var params = [start, end, rate, wallet, gameSupportFund, bountyProgram, advisors, team, GXToken.address];
  verifyCode.toABI("GXTCrowdsale.abi.txt", types, params);
  await deployer.deploy(GXTCrowdsale, start, end, rate, wallet, gameSupportFund, bountyProgram, advisors, team, GXToken.address);
  await GXToken.deployed().then(i => i.transferOwnership(GXTCrowdsale.address)); // Transfer ownership to crowdsale
  await GXTCrowdsale.deployed().then(c => c.claimTokenOwnership());
};