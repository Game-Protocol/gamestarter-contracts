var Migrations = artifacts.require("./Migrations.sol");
var verifyCode = require('../scripts/verifyCode');

module.exports = function(deployer) {
  deployer.deploy(Migrations);

  verifyCode.flatten();
};
