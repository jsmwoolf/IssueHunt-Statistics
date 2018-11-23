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
        $('article.repositoryCard').each((i, elem) => {
                repoList[i] = {};

                repoList[i]['URL']  =   $('a', elem).attr('href');
                repoList[i]['Name']  =   $('em', 'header', elem).text();
                repoList[i]['Owner']  =   $('span.owner', 'header', elem).text();
                repoList[i]['Language']  =   $('p.language', 'header', elem).text();
                repoList[i]['Description']  =   $('p.repositoryCard__text', 'header', elem).text();

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
const downloadRepoIssueData = (callback) => {
    const options = {
        uri: `https://issuehunt.io`,
        transform: function (body) {
          return cheerio.load(body);
        }
    };

    client.getSession((session) => {
        return session.sql(
            `SELECT URL FROM IssueHunt_Database.Repos WHERE name = '${name}' AND owner = '${owner}';`
        ).execute((row) => {
            options.uri += row[0];
            rp(options).then(($) => {
                $('article.issueCard').each((i, elem) => {
                        repoList[i] = {};
        
                        repoList[i]['URL']  =   $('a', elem).attr('href');
                        repoList[i]['Name']  =   $('em', 'header', elem).text();
                        repoList[i]['Owner']  =   $('span.owner', 'header', elem).text();
                        repoList[i]['Language']  =   $('p.language', 'header', elem).text();
                        repoList[i]['Description']  =   $('p.repositoryCard__text', 'header', elem).text();
        
                        repoList[i]['Active Deposit'] = $('dd', 'footer', elem)[0]['children'][0].data.substr(1);
                        repoList[i]['Opened Issues'] = $('dd', 'footer', elem)[1]['children'][0].data;
                        repoList[i]['Funded'] = $('dd', 'footer', elem)[2]['children'][0].data.substr(1);
                })
            })
        })
    });
};

/**
 * Formats today's date in a format that can be recognized by MySQL.
 */
const returnFormattedDate= (date) => {
    const day = date.getUTCDate() < 10 ? "0" + String(date.getUTCDate()) : String(date.getUTCDate());
    return `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
};

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
            .sql('SELECT name FROM IssueHunt_Database.Repos;')
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

const insertGeneralRepoData = (data, retrievedDate) => {
    let description = data.Description;
    const language = data.Language === '' ? 'NULL' : data.Language ;
    const activeFunds = data['Active Deposit']
    const openIssues = data['Opened Issues']
    const funded = data.Funded;
    const retrieved = retrievedDate;
    const name = data.Name;
    const owner = data.Owner;
    if (description.indexOf('\'') !== -1) {
        description = description.replace(/\'/g,'\'\'');
    }

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

module.exports = {
    loadNewRepoListData, 
    getCountByDate, 
    getTotalFundsByDate, 
    getOpenIssuesByDate,
    getRepoList,
};