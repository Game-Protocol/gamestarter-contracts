// Returns the time of the last mined block in seconds

var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

function latestTime () {
  return web3.eth.getBlock('latest').timestamp;
}

module.exports = {
  latestTime: latestTime,
};