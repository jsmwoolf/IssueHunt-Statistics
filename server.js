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

app.get('/global/update', (req, res) => {
    dataServer.loadNewRepoListData(() => {
        res.json({done:true});
    });
})

app.get('/global/count', (req, res) => {
    console.log('Retreiving number of repos');
    dataServer.getCountByDate((dataset) => { 
        res.json({
            "results": dataset
        })
    });
});

app.get('/global/funds', (req, res) => {
    dataServer.getTotalFundsByDate((dataset) => {
        res.json({
            "results": dataset
        })
    });
});

app.get('/global/issues', (req, res) => {
    dataServer.getOpenIssuesByDate((dataset) => {
        res.json({
            "results": dataset
        })
    });
});

app.get('/repo/listAll', (req, res) => {
    dataServer.getRepoList((dataset) => {
        res.json({results:dataset});
    });
})

app.get('/repo/update', (req, res) => {
    const name = req.query.name;
    const owner = req.query.owner;
    console.log('Grab repo issue information')
    dataServer.loadNewIssuesData(name, owner, () => {
        res.json({done:true});
    });
})

app.get('/repo/issues', (req, res) => {
    const name = req.query.name;
    const owner = req.query.owner;
    console.log('Retrieve repo issues from database');
    dataServer.getIssuesByRepo(name, owner, (dataset) => {
        res.json({results:dataset});
    });
})


server.listen(port, () => {
    console.log(`Listing to port ${port}`);
});
