const mysqlx = require('@mysql/xdevapi');
const rp = require('request-promise');
const cheerio = require('cheerio');

const serverOptions = {
    host: 'localhost',
    password: 'rootroot',
    user: 'root',
    connectTimeout:0
};

let client = mysqlx.getSession(serverOptions);

////////////////////////////////////////////////////////////////////////////////
// Heper Methods
////////////////////////////////////////////////////////////////////////////////

/**
 * Formats today's date in a format that can be recognized by MySQL.  We work
 * with UTC time for consistency.
 */
const returnFormattedDate= (date) => {
    const day = date.getUTCDate() < 10 ? "0" + String(date.getUTCDate()) : String(date.getUTCDate());
    return `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
};

/**
 * Returns a SQL safe string.
 * 
 * @param {*} str
 *      The string that will be converted.
 */
const returnSQLSafeString = (str) => {
    if (str.indexOf('\'') !== -1) {
        str = str.replace(/\'/g,'\'\'');
    }
    return str;
};

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Download data from IssueHunt.io to grab all general repository information.
 * 
 * @param {*} callback
 *      The callback function that will be used when executing is returned.
 */
const downloadRepoListData = (callback) => {
    const options = {
        uri: `https://issuehunt.io/repos`,
        transform: function (body) {
          return cheerio.load(body);
        }
    };

    let repoList = []

    rp(options).then(($) => {
        $('div.col-sm-12').each((i, elem) => {
                repoList[i] = {};

                repoList[i]['URL']  =   $('a.hit', elem).attr('href');
                repoList[i]['Name']  =   $('em', 'header', elem).text();
                repoList[i]['Owner']  =   $('span', 'header', elem).text();
                repoList[i]['Language']  =   $('strong.language', 'header', elem).text();
                repoList[i]['Description']  =   $('p', 'header', elem).text();

                repoList[i]['Active Deposit'] = $('dd', 'footer', elem)[0]['children'][0].data.substr(1);
                repoList[i]['Opened Issues'] = $('dd', 'footer', elem)[1]['children'][0].data;
                repoList[i]['Funded'] = $('dd', 'footer', elem)[2]['children'][0].data.substr(1);
        })
    }).then(() => {
        console.log('Repo list has been downloaded!');
        //console.log(repoList);
        return callback(repoList);
    })
};

/**
 * Stores new downloaded data into the database from the file
 */
const loadNewRepoListData = (callback) => {
    downloadRepoListData((dataset) => {
        console.log('Adding new data into database!');
        const todaysDate = returnFormattedDate(new Date());
        let promiseRepoList = [];
        dataset.forEach((line) => {
            promiseRepoList.push(insertRepoRecord(line, todaysDate));
        });
        Promise.all(promiseRepoList).then(() => {
            console.log('Finished adding new repo data!');
            let promiseGeneralDataList = [];
            dataset.forEach((line) => {
                promiseGeneralDataList.push(insertGeneralRepoData(line, todaysDate));
            });
            Promise.all(promiseGeneralDataList).then(() => {
                console.log('Finished adding general data!');
                return callback();
            })
        })
    });
};

/**
 * Download data from IssueHunt.io to grab all issues for a particular repository.
 * NOTE: Still needs implementation.
 * 
 * @param {*} callback
 *      The callback function that will be used when executing is returned.
 */
const downloadRepoIssueData = (name, owner, callback) => {
    const options = {
        uri: null,
        transform: function (body) {
          return cheerio.load(body);
        }
    };
    const types = ['', '?tab=idle', '?tab=ready', '?tab=rewarded'];
    let issues = [];
    let promises = [];

    client.then((session) => {
        return session.sql(
            `SELECT id, URL FROM IssueHunt_Database.Repos WHERE name = '${name}' AND owner = '${owner}';`
        ).execute((row) => {
            console.log(row);
            const baseURL = `https://issuehunt.io${row[1]}`
            const repoID = row[0];
            
            console.log(`RepoID: ${repoID}`);
            console.log(baseURL);
            
            
            types.forEach((element) => {
                options.uri = `${baseURL}${element}`;
                promises.push(rp(options).then(($) => {
                    $('div.row--new > div.col-lg-7--new > ul > li').each((i, elem) => {
                        issue = {};
                        issue['URL'] = $('a.hit', elem).attr('href');
                        issue['Status'] = $('a.hit > article > header > p > em',elem).eq(0).text();
                        issue['Title']= $('a.hit > article > header > h1', elem).text();
                        const issueUser = $('a.hit > article > header > p > em.--repositoryId', elem).text();
                        issue['User'] = issueUser.substr(0, issueUser.indexOf("/"));
                        issue['IssueNumber'] = Number(issueUser.substr(issueUser.lastIndexOf('#')+1));
                        issue['Price'] = Number($('a.hit > article.issueCard >  p.price', elem).text().substr(1));
                        
                        issue['RepoID'] = repoID;
                        issues.push(issue);
                    });
                }));
            });

            Promise.all(promises).then(() => {
                console.log(issues);
                return callback(issues);
            });
        });
    });
};

/**
 * Stores new downloaded data into the database from the file
 */
const loadNewIssuesData = (name, owner, callback) => {
    downloadRepoIssueData(name, owner, (dataset) => {
        console.log('Adding dataset to!');
        let promiseRepoList = [];
        dataset.forEach((line) => {
            console.log(`Working with ${line}`);
            promiseRepoList.push(insertIssueRecord(line));
        });
        Promise.all(promiseRepoList).then(() => {
            console.log(`Finished adding issues data for ${name} by ${owner}!`);
            return callback();
        });
    });
};

////////////////////////////////////////////////////////////////////////////////
// Methods for handling global IssueHunt data.
////////////////////////////////////////////////////////////////////////////////

const getCountByDate= (callback) => {
    let rows = []
    client.then((session) => {
        return session
            .sql('SELECT retrievedDate, COUNT(*) FROM IssueHunt_Database.General_Data GROUP BY retrievedDate ORDER BY retrievedDate ASC;')
            .execute((row) => {
                row[0] = returnFormattedDate(row[0]);
                rows.push(row);
            })
    }).then((res) => {
        console.log(rows);
        return callback(rows);
    }).catch((error) => {
        throw error;
    });
};

const getTotalFundsByDate = (callback) => {
    let rows = []
    client.then((session) => {
        return session
            .sql('SELECT retrievedDate, SUM(activeFunds), SUM(funded) FROM IssueHunt_Database.General_Data GROUP BY retrievedDate ORDER BY retrievedDate ASC;')
            .execute((row) => {
                row[0] = returnFormattedDate(row[0]);
                rows.push(row);
            })
    }).then((res) => {
        console.log(rows);
        return callback(rows);
    }).catch((error) => {
        throw error;
    });
};

const getOpenIssuesByDate = (callback) => {
    let rows = []
    client.then((session) => {
        return session
            .sql('SELECT retrievedDate, SUM(openIssues) FROM IssueHunt_Database.General_Data GROUP BY retrievedDate ORDER BY retrievedDate ASC;')
            .execute((row) => {
                row[0] = returnFormattedDate(row[0]);
                rows.push(row);
            })
    }).then((res) => {
        console.log(rows);
        return callback(rows);
    }).catch((error) => {
        throw error;
    });
};

const getRepoList = (callback) => {
    let rows = []
    client.then((session) => {
        return session
            .sql('SELECT name, owner FROM IssueHunt_Database.Repos;')
            .execute((row) => {
                rows.push(row);
            })
    }).then((res) => {
        console.log(rows);
        return callback(rows);
    }).catch((error) => {
        throw error;
    });
};

////////////////////////////////////////////////////////////////////////////////
// Methods for handling global IssueHunt data.
////////////////////////////////////////////////////////////////////////////////

const getIssuesByRepo= (name, owner, callback) => {
    let results = [];
    let id = null;
    client.then((session) => {
        return session.sql(
            `SELECT id FROM IssueHunt_Database.Repos WHERE name = '${name}' AND owner = '${owner}';`
        ).execute(res => {
            id = res[0];
        }).then(() => {
            return session.sql(
                `SELECT * FROM IssueHunt_Database.Issues WHERE repoId = ${id};`
            ).execute((row) => {
                tmp = {}
                tmp['id'] = row[0];
                tmp['issueID'] = row[1];
                tmp['repoID'] = row[2];
                tmp['name'] = row[3];
                tmp['url'] = row[4];
                tmp['price'] = row[5];
                tmp['status'] = row[6];

                results.push(tmp);
            });
        });
    }).then((res) => {
        console.log(results);
        return callback(results);
    }).catch((error) => {
        throw error;
    });
};

////////////////////////////////////////////////////////////////////////////////
// Methods for inserting records into MySQL
////////////////////////////////////////////////////////////////////////////////

const insertGeneralRepoData = (data, retrievedDate) => {
    let description = returnSQLSafeString(data.Description);
    const language = data.Language === '' ? 'NULL' : data.Language ;
    const activeFunds = data['Active Deposit']
    const openIssues = data['Opened Issues']
    const funded = data.Funded;
    const retrieved = retrievedDate;
    const name = data.Name;
    const owner = data.Owner;
    return client.then((session) => {
        let table = session.getSchema('IssueHunt_Database').getTable('General_Data');
        return session.sql(
            `SELECT id FROM IssueHunt_Database.Repos WHERE name = '${name}' AND owner = '${owner}';`
        ).execute((row) => { 
            if (row.length === 1) { 
                const repoID = row[0];
                return session.sql(
                        `SELECT COUNT(*) FROM IssueHunt_Database.General_Data ` +
                        `WHERE repoID = '${repoID}' AND retrievedDate = '${retrieved}';`
                ).execute((row) => {
                    row = row[0]
                    if (row === 1) {
                        return session.sql(
                            `UPDATE IssueHunt_Database.General_Data ` +
                            `SET description = '${description}', ` +
                            `langauge = '${language}', ` +
                            `activeFunds = '${activeFunds}', ` +
                            `openIssues = '${openIssues}', ` +
                            `funded = '${funded}' ` +
                            `WHERE repoID = '${repoID}' AND retrievedDate = '${retrieved}';`
                            ).execute();
                        //NOTE: While this line is suppose to work in the module, where() is
                        // ignored.  Replace with this after fix.
                        /*table
                            .update()
                            .set('description', description)
                            .set('langauge', language)
                            .set('activeFunds', activeFunds)
                            .set('openIssues', openIssues)
                            .set('funded', funded)
                            .where(`owner = '${owner}'`)
                            .where(`name = '${name}'`)
                            .where(`retrievedDate = '${retrievedDate}'`)
                            .execute();*/
                    } else if (row === 0) {
                        return table.insert([
                            'repoID', 'description', 'langauge', 'activeFunds', 'openIssues', 'funded', 'retrievedDate'
                        ]).values([
                            repoID, description, language, activeFunds, openIssues, funded, retrieved
                        ]).execute();
                    } else {
                        throw Error("Too many records retrieved.");
                    }
                }).catch((error) => {
                    throw error;
                });
            }
        })
    })
}

const insertRepoRecord = (data, retrievedDate) => {
    const name = data.Name;
    const owner = data.Owner;
    const url = data.URL
    //console.log(`Dealing with ${name}`);
    return client.then((session) => {
        let table = session.getSchema('IssueHunt_Database').getTable('Repos');
        return session.sql(
            `SELECT COUNT(*) FROM IssueHunt_Database.Repos WHERE name = '${name}' AND owner = '${owner}';`
            )
            .execute((row) => {
                row = row[0]
                // Insert a new record for the repository
                if (row === 0) {
                    /*console.log(name);
                    console.log(owner);
                    console.log(url);*/
                    return table.insert([
                        'name', 'owner', 'url', 'insertedDate'
                    ]).values([
                        name, owner, url, retrievedDate
                    ]).execute();
                }
            });
    }).catch((error) => {
        throw error;
    });
};

const insertIssueRecord = (data) => {
    const status = data['Status'];
    const name = returnSQLSafeString(data['Title']);;
    const issueID = data['IssueNumber'];
    const price = data['Price'];
    const URL = data['URL'];
    const repoID = data['RepoID'];
    const user = data['User'];
    return client.then((session) => {
        let table = session.getSchema('IssueHunt_Database').getTable('Issues');
        return session.sql(
            `SELECT COUNT(*) FROM IssueHunt_Database.Issues WHERE repoID = ${repoID} AND issueID = ${issueID};`
            )
            .execute((row) => {
                row = row[0]
                // Insert a new record for the repository
                if (row === 1) {
                    return session.sql(
                        `UPDATE IssueHunt_Database.Issues ` +
                        `SET name = '${name}', ` +
                        `url = '${URL}', ` +
                        `price = ${price}, ` +
                        `status = '${status}', ` +
                        `createdBy = '${user}' ` +
                        `WHERE repoID = '${repoID}' AND issueID = '${issueID}';`
                        ).execute();
                }
                else if (row === 0) {
                    return table.insert([
                        'repoID', 'issueID', 'name', 'url', 'price', 'status', 'createdBy'
                    ]).values([
                        repoID, issueID, name, URL, String(price), status, user
                    ]).execute();
                }
            });
    }).catch((error) => {
        console.log(`An error occurred with ${JSON.stringify(data)}`);
        throw error;
        
    });
};


module.exports = {
    loadNewRepoListData, 
    loadNewIssuesData,
    getCountByDate, 
    getTotalFundsByDate, 
    getOpenIssuesByDate,
    getIssuesByRepo,
    getRepoList
};