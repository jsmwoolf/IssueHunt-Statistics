DROP DATABASE IF EXISTS IssueHunt_Database;

CREATE DATABASE IF NOT EXISTS IssueHunt_Database;

# Holds all repo records
CREATE TABLE IF NOT EXISTS IssueHunt_Database.IssueHunt_Repos (
    id INT AUTO_INCREMENT PRIMARY KEY,   
    name TEXT,
    description TEXT,
    langauge TEXT,
    owner TEXT,
    activeFunds DECIMAL(9, 2),
    openIssues INT,
    funded DECIMAL(9, 2),
    retrievedDate DATE
);