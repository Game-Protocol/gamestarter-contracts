import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { DrizzleProvider } from "drizzle-react";

import Token from "./contracts/GXToken.json";
import Crowdsale from "./contracts/GXTCrowdsale.json";

console.log("Token: " + Token);
console.log("Crowdsale: " + Crowdsale);

const options = {
    web3: {
      block: false,
      fallback: {
        type: "ws",
        url: "ws://127.0.0.1:7545"
      }
    },
    contracts: [Token, Crowdsale],
    events: {}
  };

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
