import React, { Component } from "react";

class InfoBar extends Component {
  state = {
    account: "0x0"
  };
  render() {
    return (
      <React.Fragment>
        <span className={this.getBadgeClasses()}>{this.formatAccount()}</span>
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

export default Token;
