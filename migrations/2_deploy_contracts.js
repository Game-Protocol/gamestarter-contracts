var toTimestamp = require('../scripts/toTimestamp');

var SubToken = artifacts.require("SubToken");
var StandardCrowdsale = artifacts.require("StandardCrowdsale");


module.exports = function (deployer) {

  var wallet = process.env.WALLET;
  var feeWallet = process.env.BENEFICIARY;

  var start = toTimestamp.getTimeStampMinutesFromNow(5); 
  var end = toTimestamp.getTimeStampMinutesFromNow(10);
  // var start = toTimestamp.getTimeStamp('2018-08-01 12:00:00');
  // var end = toTimestamp.getTimeStamp('2018-09-15 12:00:00');
  console.log(start + " - " + end);

  var rate = new web3.BigNumber(2000); // exchange rate

  deployer.deploy(SubToken).then(function () {
    deployer.deploy(StandardCrowdsale, start, end, rate, wallet, feeWallet, SubToken.address).then(function (){
      SubToken.deployed().then(function (instance){
        instance.transferOwnership(StandardCrowdsale.address); // Transfer ownership to crowdsale
      });
    });
  });
};