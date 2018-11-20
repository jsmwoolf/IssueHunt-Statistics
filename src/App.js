import React, { Component } from 'react';
import {Line} from "react-chartjs-2";

class TabBar extends Component {
  switchMode(mode) {
      this.props.changeMode(mode);
  }

  render() {
    //<button class="Tab" onClick={() => this.switchMode("Repo")}>Repos</button>
    return (
      <header className="TabBar">
       <button class="Tab" onClick={() => this.switchMode("Global")}>Global</button>
      </header>
    );
  }
}

class GlobalPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      graphData:{}
      };
  }

  /**
   * Default Component method to execute code when
   * component are created.
   */
  componentDidMount() {
    this.graphByNumberRepo();
  }

 /**
  * Allows user to retrieve latest version of the repository data.
  * 
  * @param {*} url 
  *     The url that will be called to retrieved specific data.
  * @returns A Promise that allows us to access the data.
  */
  retrieveDataSet(url) {
    return fetch('http://localhost:8080/update/repo').then(() => {
      return fetch(url).then((response) => {
        console.log('Got data');
        if (response.status === 200) {
          return response.json();
        } else {
          throw Error("Issue with response!");
        }
      });
    });
  }

  /**
   * Returns a template dataset object for graphing 
   * with Chart.js
   * 
   * @param {*} label
   *    The name of the dataset.
   * @param {*} points 
   *    The points containing the data.
   * @param {*} color 
   *    The color of the line that will represent the data.
   * @returns A JSON object in Chart.js format.
   */
  addDataSet(label, points, color) {
    return {
      label: label,
      fill: false,
      lineTension: 0.1,
      backgroundColor: `rgba(${color},0.4)`,
      borderColor: `rgba(${color},1)`,
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0.0,
      borderJoinStyle: 'miter',
      pointBorderColor: `rgba(${color},1)`,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: `rgba(${color},1)`,
      pointHoverBorderColor: 'rgba(220,220,220,1)',
      pointHoverBorderWidth: 2,
      pointRadius: 1,
      pointHitRadius: 10,
      data: points
    };
  }

  graphByNumberRepo() {
    this.retrieveDataSet('http://localhost:8080/repo/count').then((data) => {
        const dataset = data['results'];
        var dates = []
        var points = []
        dataset.forEach(element => {
          dates.push(element[0]);
          points.push(element[1]);
        });
        this.setState({
          graphData:{
            labels: dates,
            datasets: [
              this.addDataSet('Number of Repositories', points, "14,195,0")
            ]
          }
        })
      }).catch((error) => {
        throw error;
      });
  }

  graphByTotalFunds() {
    this.retrieveDataSet('http://localhost:8080/repo/funds').then((data) => {
        const dataset = data['results'];
        var dates = []
        var activePoints = []
        var fundedPoints = []
        dataset.forEach(element => {
          dates.push(element[0]);
          activePoints.push(element[1]);
          fundedPoints.push(element[2]);
        });
        this.setState({
          graphData:{
            labels: dates,
            datasets: [
              this.addDataSet('Total Active Funds', activePoints, "192,12,64"),
              this.addDataSet('Total Funded', fundedPoints, "0,70,214")
            ]
          }
        })
      }).catch((error) => {
        throw error;
      });
  }

  graphByTotalIssues() {
    this.retrieveDataSet('http://localhost:8080/repo/issues').then((data) => {
        const dataset = data['results'];
        var dates = []
        var points = []
        dataset.forEach(element => {
          dates.push(element[0]);
          points.push(element[1]);
        });
        this.setState({
          graphData:{
            labels: dates,
            datasets: [
              this.addDataSet('Number of Issues', points, "255,195,0")
            ]
          }
        })
      }).catch((error) => {
        throw error;
      });
  }

  render() {
    return (
    <div>
    <button class="showMode" onClick={() => this.graphByNumberRepo()}>Number of Repoistories</button>
    <button class="showMode" onClick={() => this.graphByTotalFunds()}>Funds</button>
    <button class="showMode" onClick={() => this.graphByTotalIssues()}>Issues</button>
    <Line
      data={this.state.graphData}
      width={600}
      height={250}
    />
    </div>);
  }
}

class RepoPanel extends Component {
    render() {
      return <p> This is the repo panel </p>;
    }
}

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
