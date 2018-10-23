import React, { Component } from "react";
import Background from "./images/background_image.jpg";

var sectionStyle = {
  width: "100%",
  height: "1024px",
  backgroundImage: "url(" + Background + ")"
};

class App extends Component {
  render() {
    return (
      <div style={sectionStyle} className="App">
        {this.props.children}
      </div>
    );
  }
}

export default App;
