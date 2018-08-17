import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import { DrizzleProvider } from "drizzle-react";

import drizzleOptions from "./drizzleOptions.js";
import "bootstrap/dist/css/bootstrap.css";
import Token from "./components/token";

ReactDOM.render(
  <DrizzleProvider options={drizzleOptions}>
    <Token />
    {/* <App /> */}
  </DrizzleProvider>,
  document.getElementById("root")
);
registerServiceWorker();
