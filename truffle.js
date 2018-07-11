var HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();

var key = process.env.MNENOMIC;
var api = process.env.INFURA_API_KEY;

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gasPrice: 20000000000,
      gas: 5712388
    },
    mainnet: {
      provider: () => new HDWalletProvider(key, "https://mainnet.infura.io/" + api),
      network_id: 2,
    },
    ropsten: {
      provider: () => new HDWalletProvider(key, "https://ropsten.infura.io/" + api),
      network_id: 3,
      gas: 4600000
    },
    rinkeby: {
      provider: () => new HDWalletProvider(key, "https://rinkeby.infura.io/" + api),
      network_id: 4,
      gas: 4600000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 5000000
    }
  }
};