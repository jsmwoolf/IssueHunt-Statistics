import React, { Component } from 'react';
import {GlobalPanel} from './components/GlobalPanel.js';
import {RepoPanel} from './components/RepoPanel.js';
import {TabBar} from './components/TabBar.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {tabmode: "Global"}
  }

  changeMode(mode) {
    this.setState({
        tabmode: mode
      });
  }
  
  render() {
    const myMode = this.state.tabmode;
    console.log(myMode);
    //
    return (
      <div className="App">
        <TabBar changeMode={(mode)=>this.changeMode(mode)}/>
        <div>
          { myMode === "Global" ? <GlobalPanel /> : myMode === "Repo" ?<RepoPanel /> : <p>Hello</p> }
        </div>
      </div>
    );
  }
}

export default App;
