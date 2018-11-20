# IssueHunt Statistics

Created with React, this application displays statistics for IssueHunt repositories.

## Software Prerequisites

To run the application, you'll need to install MySQL 8.  Do __NOT__ use MySQL 5.7, as the protocol is changed.

## Installation

To run the application, you'll need to install the yarn and concurrently programs.  To install these programs, run the following commands:

```bash
npm install -g concurrently
npm install -g yarn
```

To install the modules required, run the following command in command line:

```bash
npm install
```

## Running the Application

For first time usage, you'll need to import the schema from schema.sql.  You can run the following command:

```bash
mysql -u <username> -p IssueHunt_Database < schema.sql
```

The command above can also reinitialize the database.

To run on a local machine, enter the following command:

```bash
yarn dev
```

## Current Functionality

The program can currently do the following:
* Retrieve the number of repositories on a given day.
* Retrieve the amount of money funded in total
* Retrieve the total number of open issues.