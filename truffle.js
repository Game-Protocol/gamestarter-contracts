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
      gas: 4600000
    },
    // commented out until the truffle issue is fixed
    // "Command doesn't return and stuck at `Saving artifacts...` when using hdwallet provider." 
    // https://github.com/trufflesuite/truffle-migrate/issues/14

    // mainnet: {
    //   provider: new HDWalletProvider(key, "https://mainnet.infura.io/" + api),
    //   network_id: 2,
    // },
    // ropsten: {
    //   provider: new HDWalletProvider(key, "https://ropsten.infura.io/" + api),
    //   network_id: 3,
    //   gas: 4600000
    // },
    // rinkeby: {
    //   provider: new HDWalletProvider(key, "https://rinkeby.infura.io/" + api),
    //   network_id: 4,
    // }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};