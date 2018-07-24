import Token from "./contracts/GXToken.json";
import Crowdsale from "./contracts/GXTCrowdsale.json";
// Import contract
import TutorialToken from "./contracts/TutorialToken.json";

console.log("TutorialToken: " + TutorialToken);
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
    TutorialToken,
  ],
  events: {
  },
  polls: {
    accounts: 1500
  }
}

export default drizzleOptions