#DROP DATABASE IF EXISTS IssueHunt_Database;

CREATE DATABASE IF NOT EXISTS IssueHunt_Database;

# Holds basic repo data.  Should only be modified when repositories are added or removed
CREATE TABLE IF NOT EXISTS IssueHunt_Database.Repos (
    id INT AUTO_INCREMENT PRIMARY KEY,   
    name TEXT,
    owner TEXT,
    url TEXT,
    insertedDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

# Holds all general data from repo.
CREATE TABLE IF NOT EXISTS IssueHunt_Database.General_Data (
    id INT AUTO_INCREMENT PRIMARY KEY,   
    repoID INT NOT NULL,
    description TEXT,
    langauge TEXT,
    activeFunds DECIMAL(9, 2),
    openIssues INT,
    funded DECIMAL(9, 2),
    retrievedDate DATE,
    FOREIGN KEY (repoID) REFERENCES Repos(id)
);

# Holds issue o
CREATE TABLE IF NOT EXISTS IssueHunt_Database.Issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issueID INT NOT NULL,   
    repoID INT NOT NULL,
    name TEXT,
    url TEXT,
    price DECIMAL(9, 2),
    status TEXT,
    FOREIGN KEY (repoID) REFERENCES Repos(id)
);