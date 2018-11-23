import React, { Component } from 'react';
import './panel.css';

export class RepoPanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
        repoList:[],
        currentRepo:null
      }
    }

    componentDidMount() {
      this.showRepoList();
    }

    displayRepoInformation(name) {
      console.log(`Getting repo information for ${name}`);
      this.setState({
        currentRepo:name
      });
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

    showRepoList() {
      this.retrieveDataSet('http://localhost:8080/repo/list').then((data) => {
        const dataset = data['results'];
        let repos =[]
        dataset.forEach(element => {
          repos.push(
            <button className="showOptionsButton" onClick={(name) => this.displayRepoInformation(element)}>
              {element}
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
          {this.state.currentRepo === null ? 
            <div className="repoList">
              {repos} 
            </div>
            : <p>I chose {this.state.currentRepo}</p>}
        </div>
      );
    }
}