import Token from "./contracts/GXToken.json";
import Crowdsale from "./contracts/GXTCrowdsale.json";

console.log("Token: " + Token);
console.log("Crowdsale: " + Crowdsale);

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:7545'
    }
  },
  contracts: [
    Token,
    Crowdsale,
  ],
  events: {
  },
  polls: {
    accounts: 1500
  }
}

export default drizzleOptions