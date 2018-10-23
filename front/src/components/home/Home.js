import React, { Component } from "react";
import PropTypes from "prop-types";
import Token from "../token";
import InfoBar from "../infoBar";
import Crowdsale from "../crowdsale";

var bgColors = {
  Default: "#81b71a",
  Blue: "#00B1E1",
  Cyan: "#37BC9B",
  Green: "#8CC152",
  Red: "#E9573F",
  Yellow: "#F6BB42"
};

class Home extends Component {
  constructor(props, context) {
    super(props);

    this.context = context;
    var state = context.drizzle.store.getState();

    if (state.drizzleStatus.initialized) {
      this.contracts = context.drizzle.contracts;
      this.balance = this.contracts.GXToken.methods.balanceOf.cacheCall(
        this.props.accounts[0]
      );
      this.symbol = this.contracts.GXToken.methods.symbol.cacheCall();
    }
  }

  render() {
    var account = this.props.accounts[0];
    // console.log("Account: " + account);
    // console.log("drizzleStatus: " + JSON.stringify(this.props.drizzleStatus));
    // console.log("Token: " + JSON.stringify(this.props.GXToken));
    // console.log("Crowdsale: " + JSON.stringify(this.props.GXTCrowdsale));
    // console.log("symbol: " + JSON.stringify(this.props.GXToken.symbol[this.symbol]));

    // var tokenSymbol =
    //   this.symbol in this.props.GXToken.symbol
    //     ? this.props.GXToken.symbol[this.symbol].value
    //     : "";
    // var tokenBalance =
    //   this.balance in this.props.GXToken.balanceOf
    //     ? this.props.GXToken.balanceOf[this.balance].value
    //     : "Loading...";

    return (
      <main className="container">
        <div>
          <div>
            {/* <p>
              <strong>Account</strong>: {account}
            </p>
            <p>
              <strong>My Balance</strong>: {tokenBalance} {tokenSymbol}
            </p> */}
          </div>
          <div style={{ backgroundColor: bgColors.Cyan }}>
            <InfoBar account={account} context={this.context} />
          </div>
          <div>
            <Token />
          </div>
          <div>
            <Crowdsale />
          </div>
        </div>
      </main>
    );
  }
}

Home.contextTypes = {
  drizzle: PropTypes.object
};

export default Home;
