import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { DrizzleProvider } from "drizzle-react";

import TutorialToken from "../../contracts/TutorialToken.json";

console.log(TutorialToken);

const options = {
    web3: {
      block: false,
      fallback: {
        type: "ws",
        url: "ws://127.0.0.1:7545"
      }
    },
    contracts: [TutorialToken],
    events: {}
  };

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
