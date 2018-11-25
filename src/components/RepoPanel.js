import React, { Component } from 'react';
import {Pie} from "react-chartjs-2";
import './panel.css';

export class RepoPanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
        repoList:[],
        currentRepo:{
          name:null,
          issues:[]
        }
      }
    }

    componentDidMount() {
      this.showRepoList();
    }
    /**
    * Allows user to retrieve latest version of the repository data.
    * 
    * @param {*} url 
    *     The url that will be called to retrieved specific data.
    * @returns A Promise that allows us to access the data.
    */
    retrieveDataSet(url) {
      return fetch(url).then((response) => {
        console.log('Got data');
        if (response.status === 200) {
          return response.json();
        } else {
          throw Error("Issue with response!");
        }
      });
    }

    retrieveRepoInformation(name, owner) {
      console.log(`Getting repo information for ${name} by ${owner}`);
      fetch(`http://localhost:8080/repo/update?name=${name}&owner=${owner}`).then(() => {
        console.log('Issues updated');
        this.retrieveDataSet(`http://localhost:8080/repo/issues?name=${name}&owner=${owner}`).then(data => {
          this.setState({
            currentRepo:{
              issues:data['results'],
              name:name
            }
          }); 
        });
      });
    }

    showIssuePercentage() {
      const issues = this.state.currentRepo.issues;
      let fundNumbers = [];
      let fundLabel = []
      issues.forEach((element) => {
        const curIndx = fundLabel.indexOf(element['status']);
        if (curIndx === -1) {
          fundLabel.push(element['status']);
          fundNumbers.push(1);
        } else {
          fundNumbers[curIndx] += 1;
        }
      });
      const data = {
        labels: fundLabel,
        datasets: [{
          data: fundNumbers,
          backgroundColor: [
            '#FF0000',
            '#00FF00',
            '#0000FF',
            '#000000'
            ]
        }]
      };
      console.log(data);
      return ( 
        <Pie
          data={data}
          width={400}
          height={400}
          options={{
            maintainAspectRatio: false
          }}
        /> );
    }

    displayRepoInformation() {
      return (
        <div>
          <h2>{this.state.currentRepo.name} Statistics</h2>
          <div>
            {this.showIssuePercentage()}
          </div>
        </div>
      )
    }


    showRepoList() {
      this.retrieveDataSet('http://localhost:8080/repo/listAll').then((data) => {
        const dataset = data['results'];
        let repos =[]
        dataset.forEach(element => {
          const name = element[0];
          const owner = element[1];
          repos.push(
            <button className="showOptionsButton" onClick={() => this.retrieveRepoInformation(name, owner)}>
              {name}
            </button>
          );
        });
        this.setState({
          repoList:repos
        }) ;
      });
    }

    render() {
      let repos = this.state.repoList;
      console.log(repos);
      return (
        <div>
          {this.state.currentRepo.name === null ? 
            <div className="repoList">
              {repos} 
            </div>
            : <div>{this.displayRepoInformation()}</div>}
        </div>
      );
    }
}