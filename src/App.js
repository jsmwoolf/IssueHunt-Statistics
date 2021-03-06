import React, { Component } from 'react';
import {GlobalPanel} from './components/GlobalPanel.js';
import {RepoPanel} from './components/RepoPanel.js';
import {TabBar} from './components/TabBar.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tabmode: "Global",
      updateInterval: 15 * 60 * 1000,
      updateTimer: null
    }
  }

  changeMode(mode) {
    this.setState({
        tabmode: mode,
        updateInterval: this.state.updateInterval
      });
  }

  updateRepoData() {
    fetch('http://localhost:8080/global/update').then(() => {
      console.log('Updated database from Issuehunt.io');
    });
  }

  componentDidMount() {
    // Update the database every 15 mintues
    this.updateRepoData();
    let updater = setInterval(() => {
      this.updateRepoData();
    }, this.state.updateInterval);
    this.setState({
      updateTimer:updater
    })
    console.log(`Set up to update every ${this.state.updateInterval / 60000} minutes`);
  }

  componentWillUnmount() {
    clearInterval(this.state.updater);
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
