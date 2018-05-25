var HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4600000
    },
    mainnet: {
      provider: new HDWalletProvider(process.env.MNENOMIC, "https://mainnet.infura.io/" + process.env.INFURA_API_KEY),
      network_id: 2,
    },
    ropsten: {
      provider: new HDWalletProvider(process.env.MNENOMIC, "https://ropsten.infura.io/" + process.env.INFURA_API_KEY),
      network_id: 3,
      gas: 4600000
    },
    rinkeby: {
      provider: new HDWalletProvider(process.env.MNENOMIC, "https://rinkeby.infura.io/" + process.env.INFURA_API_KEY),
      network_id: 4,
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};