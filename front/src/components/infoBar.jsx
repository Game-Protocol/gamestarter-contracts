import React, { Component } from "react";

class InfoBar extends Component {
  constructor(props) {
    super(props);

    // this.context = props.context;
    var state = props.context.drizzle.store.getState();
    console.log("State: " + JSON.stringify(state));

    if (state.drizzleStatus.initialized) {
      this.contracts = props.context.drizzle.contracts;
      // this.balance = this.contracts.GXToken.methods.balanceOf.cacheCall(
      //   this.props.accounts[0]
      // );
      this.symbol = this.contracts.GXToken.methods.symbol.cacheCall();
    }
  }
  render() {
    var tokenSymbol =
      this.symbol in this.contracts.GXToken.symbol
        ? this.contracts.GXToken.symbol[this.symbol].value
        : "";
    // var tokenBalance =
    //   this.balance in this.props.GXToken.balanceOf
    //     ? this.props.GXToken.balanceOf[this.balance].value
    //     : "Loading...";
    console.log("tokenSymbol: " + tokenSymbol);


    return (
      <React.Fragment>
        {/* <span className={this.getBadgeClasses()}>{this.formatAccount()}</span> */}
        <div>
          <p>
            <strong>Account</strong>: {this.props.account}
          </p>
          <p>
            {/* <strong>My Balance</strong>: {tokenBalance} {tokenSymbol} */}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm">Button!!!</button>
      </React.Fragment>
    );
  }

  formatAccount() {
    const { account } = this.state;
    return account;
  }

  getBadgeClasses() {
    let classes = "badge m-2 badge-primary";
    return classes;
  }
}

export default InfoBar;
