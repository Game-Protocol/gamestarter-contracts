import Token from "./build/contracts/GXToken.json";
import Crowdsale from "./build/contracts/GXTCrowdsale.json";

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: "ws",
      url: "ws://127.0.0.1:7545"
    }
  },
  contracts: [Token, Crowdsale],
  events: {},
  polls: {
    accounts: 1500
  }
};

export default drizzleOptions;
