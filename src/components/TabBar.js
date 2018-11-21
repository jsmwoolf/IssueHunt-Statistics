import React, { Component } from 'react';

export class TabBar extends Component {
    switchMode(mode) {
        this.props.changeMode(mode);
    }
  
    render() {
      //<button class="Tab" onClick={() => this.switchMode("Repo")}>Repos</button>
      return (
        <header className="TabBar">
         <button className="TabButton" onClick={() => this.switchMode("Global")}>Global</button>
        </header>
      );
    }
  }