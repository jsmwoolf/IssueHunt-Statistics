import React, { Component } from 'react';

export class RepoPanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
        repoList:[],
        currentRepo:null
      }
    }

    componentDidMount() {
      //this.showRepoList()
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
        let repos = []
        dataset.forEach(element => {
          repos.push(<button>{element}</button>);
        });
        return repos;
      });
    }

    render() {
      return (
        <div>
          {this.state.currentRepo === null ? 
            <div className="repoList">
              {this.showRepoList()} 
            </div>
            : <p>I chose {this.state.currentRepo}</p>}
        </div>
      );
    }
}