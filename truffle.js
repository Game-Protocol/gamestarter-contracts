var HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();

var key = process.env.MNENOMIC;
var api = process.env.INFURA_API_KEY;

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545, // 8545 for console version of ganache | 7545 for application version
      network_id: "*", // Match any network id
      gas: 4600000
    },
    // commented out until the truffle issue is fixed
    // "Command doesn't return and stuck at `Saving artifacts...` when using hdwallet provider." 
    // https://github.com/trufflesuite/truffle-migrate/issues/14

    mainnet: {
      provider: function () {
        new HDWalletProvider(key, "https://mainnet.infura.io/" + api)
      },
      network_id: 2,
    },
    ropsten: {
      provider: function () {
        new HDWalletProvider(key, "https://ropsten.infura.io/" + api)
      },
      network_id: 3,
      gas: 4600000
    },
    rinkeby: {
      provider: function () {
        new HDWalletProvider(key, "https://rinkeby.infura.io/" + api)
      },
      network_id: 4,
      gas: 4600000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};