import React from "react";
import ReactDOM from "react-dom";
import registerServiceWorker from "./registerServiceWorker";
import { Router, Route, IndexRoute, browserHistory } from "react-router";
import { syncHistoryWithStore } from "react-router-redux";
import { DrizzleProvider } from "drizzle-react";
import "bootstrap/dist/css/bootstrap.css";

// Layouts
import App from "./App";
import Token from "./components/token.jsx";
// import HomeContainer from "./layouts/home/HomeContainer";
import { LoadingContainer } from "drizzle-react-components";

import store from "./store";
import drizzleOptions from "./drizzleOptions";

// Initialize react-router-redux.
const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <DrizzleProvider options={drizzleOptions} store={store}>
    <LoadingContainer>
      <Router history={history}>
        <Route path="/" component={App}>
          {/* <IndexRoute component={HomeContainer} /> */}
          <IndexRoute component={Token} />
        </Route>
      </Router>
    </LoadingContainer>
  </DrizzleProvider>,
  document.getElementById("root")
);
registerServiceWorker();
