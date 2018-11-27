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

    showIssuePercentage(issues) {
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
          width={200}
          height={200}
          options={{
            maintainAspectRatio: false
          }}
        /> );

    }

    showIssuePriceStats(issues) {
      const getMedian = (a) => {
        const mid = a.length >> 1;
        console.log(`Length: ${a.length}, Midpoint: ${mid}`);
        let res = a[0];
        if (mid & 1 === 1) {
          res = a[mid];
        } else if (mid !== 0) {
          res = (a[mid] + a[mid-1]) / 2;
        }
        return res;
      };
      let numUnfunded = 0;
      let priceByStatus = {};
      let pricesArray = [];
      // Variables on average pricing
      let avgPricing = 0;
      let avgSubmitPrice = 0,
          avgReadyPrice = 0,
          avgRewarded = 0;
      // Variables on median pricing
      let medianPrice = 0;
      let medianPriceSubmitPrice = 0,
          medianPriceReadyPrice = 0,
          medianPriceRewarded = 0;

      issues.forEach((element) => {
        // Count unfunded
        if (element['status'] === "Unfunded") {
          numUnfunded += 1;
        } else {
          if (!(element['status'] in priceByStatus)) {
            priceByStatus[element['status']] = [];
          }
          priceByStatus[element['status']].push(element["price"]);
          avgPricing += element["price"];
        }
      });


      if ("Submitted" in priceByStatus) {
        priceByStatus["Submitted"].sort();
        avgSubmitPrice = priceByStatus["Submitted"].reduce((sum, val) => sum+=val, 0) / priceByStatus["Submitted"].length;
        medianPriceSubmitPrice = getMedian(priceByStatus["Submitted"]);
        pricesArray = pricesArray.concat(priceByStatus["Submitted"]);
      }
      if ("Funded" in priceByStatus) {
        priceByStatus["Funded"].sort();
        avgReadyPrice = priceByStatus["Funded"].reduce((sum, val) => sum+=val, 0) / priceByStatus["Funded"].length;
        medianPriceReadyPrice = getMedian(priceByStatus["Funded"]);
        pricesArray = pricesArray.concat(priceByStatus["Funded"]);
      }
      if ("Rewarded" in priceByStatus) {
        priceByStatus["Rewarded"].sort();
        avgRewarded = priceByStatus["Rewarded"].reduce((sum, val) => sum+=val, 0) / priceByStatus["Rewarded"].length;
        medianPriceRewarded = getMedian(priceByStatus["Rewarded"]);
        pricesArray = pricesArray.concat(priceByStatus["Rewarded"]);
      }
      if (issues.length !== numUnfunded) {
        pricesArray.sort();
        avgPricing /= (issues.length - numUnfunded);
        medianPrice = getMedian(pricesArray);

      }

      return (
        <div>
          <h3>Averages</h3>
          <p>Price: {avgPricing}</p>
          {"Funded" in priceByStatus ? <p>Price of ready issue: {avgReadyPrice}</p> : null}
          {"Submitted" in priceByStatus ? <p>Price of submitted issue: {avgSubmitPrice}</p> : null}
          {"Rewarded" in priceByStatus ? <p>Price of rewarded issue: {avgRewarded}</p> : null}
          <h3>Medians</h3>
          <p>Price: {medianPrice}</p>
          {"Funded" in priceByStatus ? <p>Price of ready issue: {medianPriceReadyPrice}</p> : null}
          {"Submitted" in priceByStatus ? <p>Price of submitted issue: {medianPriceSubmitPrice}</p> : null}
          {"Rewarded" in priceByStatus ? <p>Price of rewarded issue: {medianPriceRewarded}</p> : null}
        </div>
      )
    }

    displayRepoInformation() {
      const issues = this.state.currentRepo.issues;
      return (
        <div>
          <h1>{this.state.currentRepo.name} Statistics</h1>
          {issues.length !== 0 ? 
          <div>
            <h2>Issue Representation</h2>
            {this.showIssuePercentage(issues)}
            <h2>Pricing Statistics</h2>
            {this.showIssuePriceStats(issues)}
          </div>
          : <p>There are no issues in this repository.</p>
          }
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