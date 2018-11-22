import React, { Component } from 'react';

export class TabBar extends Component {

  constructor(props) {
    super(props);
  }
  
    render() {
      return (
        <header className="TabBar">
         <button className="TabButton" onClick={() => this.props.changeMode("Global")}>Global</button>
         <button className="TabButton" onClick={() => this.props.changeMode("Repo")}>Repos</button>
        </header>
      );
    }
  }