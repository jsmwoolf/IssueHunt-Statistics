const express = require('express');
const http = require('http');
const app = express();
const bodyParser = require('body-parser');
const dataServer = require('./src/dataHandle');
const cors = require('cors');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const port = process.env.PORT || 8080;
let server = http.createServer(app);

app.get('/update/repo', (req, res) => {
    dataServer.loadNewRepoListData(() => {
        res.json({done:true});
    });
})

app.get('/repo/list', (req, res) => {
    dataServer.getRepoList((dataset) => {
        res.json({results:dataset});
    });
})

app.get('/repo/count', (req, res) => {
    console.log('Retreiving number of repos');
    dataServer.getCountByDate((dataset) => { 
        res.json({
            "results": dataset
        })
    });
});

app.get('/repo/funds', (req, res) => {
    dataServer.getTotalFundsByDate((dataset) => {
        res.json({
            "results": dataset
        })
    });
});

app.get('/repo/issues', (req, res) => {
    dataServer.getOpenIssuesByDate((dataset) => {
        res.json({
            "results": dataset
        })
    });
});

server.listen(port, () => {
    console.log(`Listing to port ${port}`);
});
