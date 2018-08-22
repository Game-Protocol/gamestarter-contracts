import React, { Component } from "react";
import "./App.css";

import { drizzleConnect } from "drizzle-react";
import { ContractData, ContractForm } from "drizzle-react-components";
import Token from "./components/token.jsx";
import Token from "./components/infoWars.jsx";
import Token from "./components/crowdsale.jsx";

class App extends Component {
  render() {
    const { drizzleStatus, accounts } = this.props;
    console.log(accounts);

    if (drizzleStatus.initialized) {
      return (
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">GXToken</h1>
            <p>
              <strong>Account</strong>: {accounts[0]}
            </p>
            <p>
              <strong>Total Supply</strong>:{" "}
              <ContractData
                contract="GXToken"
                method="totalSupply"
                methodArgs={[{ from: accounts[0] }]}
              />{" "}
              <ContractData contract="GXToken" method="symbol" hideIndicator />
            </p>
            <p>
              <strong>My Balance</strong>:{" "}
              <ContractData
                contract="GXToken"
                method="balanceOf"
                methodArgs={[accounts[0]]}
              />{" "}
              <ContractData contract="GXToken" method="symbol" hideIndicator />
            </p>
            <p>
              <strong>Owner of token</strong>:{" "}
              <ContractData contract="GXToken" method="owner" methodArgs={[]} />
            </p>
            <h3>Send Tokens</h3>
          </header>
          <div className="App-intro">
            mint
            <ContractForm
              contract="GXToken"
              method="mint"
              labels={["To Address", "Amount"]}
            />
          </div>
          <div className="App-intro">
            transfer
            <ContractForm
              contract="GXToken"
              method="transfer"
              labels={["To Address", "Amount to Send"]}
            />
          </div>
          <div className="App-intro">
            buy tokens from crowdsale
            <ContractForm
              contract="GXTCrowdsale"
              method="buyTokens"
              labels={["Amount to Send"]}
            />
          </div>
          <Token />
        </div>
      );
    }
    return <div>Loading dapp...</div>;
  }
}

const mapStateToProps = state => {
  return {
    accounts: state.accounts,
    drizzleStatus: state.drizzleStatus,
    Token: state.contracts.Token,
    Crowdsale: state.contracts.Crowdsale
  };
};

const AppContainer = drizzleConnect(App, mapStateToProps);
export default AppContainer;
