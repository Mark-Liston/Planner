// database.js

"use strict";

const bcrypt = require('bcrypt');
const scrape = require("./scrape.js");
const coursePlan = require("./coursePlan.js");
const planDef = require("./planDef.js");
const { promises } = require('stream');

const sqlite = require("sqlite3").verbose();

const dbPath = "./server/database/Planner.db";

//Ensure account table is created
createAccountTable();

function createAccountTable() {
    let db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, function(error)
        {
            if (error)
            {
                console.error(error.message);
            }
        }
    );

    let query = `
    CREATE TABLE IF NOT EXISTS Users (
        email TEXT PRIMARY KEY,
        username TEXT,
        password VARCHAR(60)
    );
    `;

    // Create user table 
    db.run(query, (err) => {
        if (err) {
            console.log(err);
            throw err;
        }
    });

    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
    });

    // For testing add test account
    // email: test@testmail.com
    // pass: test1234567890
    createAccount('test@testmail.com', 'tester0', 'test1234567890');
}

function createAccount(email, username, password){
    let db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, function(error)
        {
            if (error)
            {
                console.error(error.message);
            }
        }
    );

    const salt = bcrypt.genSaltSync(10);
    // now we set user password to hashed password
    let hashPwd = bcrypt.hashSync(password, salt);

    db.run(`INSERT OR IGNORE INTO Users(email, username, password)
              VALUES(?, ?, ?)`,
              [email, username, hashPwd],
        (err) => {
            if (err) {
                console.log(err);
                console.log("Failed to create account");
                throw err;
            }
        }
    );

    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
    });
}

async function getAccount(email) {
    return new Promise((resolve, reject) => {
            let db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, function(error)
            {
                if (error)
                {
                    console.error(error.message);
                }
            }
        );

        // Get matchign account
        db.get(`SELECT *
                FROM Users
                WHERE email  = ?`,
                [email],
            (err, row) => {
                // Close database
                db.close((err) => {
                    if (err) {
                        console.error(err.message);
                    }
                });

                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

function getSuggestions(type, matchString)
{
    return new Promise(function(resolve, reject)
    {
        let table = "";
        // Potentially unecessary as table names are likely case-insensitive.
        switch (type.toUpperCase())
        {
            case "DEGREE":
                table = "Degree";
                break;
            case "MAJOR":
                table = "Major";
                break;
            case "UNIT":
                table = "Unit";
                break;
            default:
                break;
        }

        let item = null;
        let db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, function(error)
        {
            if (error)
            {
                console.error(error.message);
            }
        });
        
        // Gets all items of the given type containing the matchString.
        let qry = "SELECT code || ' - ' || json_extract(" + table + ".data, '$.title') AS name" +
                " FROM " + table +
                " WHERE json_valid(" + table + ".data) AND" +
                " (" +
                    " json_extract(" + table + ".data, '$.title') LIKE ? OR" +
                    " json_extract(" + table + ".data, '$.code') LIKE ?" +
                " )" +
                " GROUP BY name";
        db.all(qry, [matchString, matchString], function(error, rows)
        {
            let result = [];
            if (error)
            {
                console.error(error.message);
            }

            else
            {
                // Turns array of objects into array of strings.
                for (let entry of rows)
                {
                    result.push(entry.name);
                }
            }

            db.close(function(error)
            {
                if (error)
                {
                    console.error(error.message);
                }
            });

            resolve(result);
        });
    });
}

// Gets today's date in ISO format and removes last 14 chars to isolate yyyy-mm-dd.
function getDate()
{
    return new Date().toISOString().slice(0, -14)
}

// TODO: Modularise this function further.
function cacheSearch(type, searchParams)
{
    return new Promise(function(resolve, reject)
    {
        // Can only perform search if code is provided.
        if (searchParams["code"])
        {
            let table = "";
            let searchType = "";
            switch (type.toUpperCase())
            {
                case "DEGREE":
                    table = "Degree";
                    searchType = ["murdoch_pcourse"];
                    break;
                case "MAJOR":
                    table = "Major";
                    searchType = ["murdoch_paos"];
                    break;
                case "UNIT":
                    table = "Unit";
                    searchType = ["murdoch_psubject"];
                    break;
                default:
                    break;
            }

            let item = null;
            let db = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, function(error)
            {
                if (error)
                {
                    console.error(error.message);
                }
            });
            
            // Gets any items from the last 6 months with a matching code.
            // Items are updated every 6 months.
            let qry = "SELECT *" +
                    " FROM " + table +
                    " WHERE code = ? AND" +
                    " retrievedOn > date(?, '-6 month')" +
                    " ORDER BY retrievedOn ASC";
            db.all(qry, [searchParams.code.toUpperCase(), getDate()], async function(error, rows)
            {
                if (error)
                {
                    console.error(error.message);
                }

                else
                {
                    // If there is no matching item in the database from the last 6 months.
                    if (rows.length == 0)
                    {
                        // If both the version and the code are given, fetch the
                        // item directly.
                        if (searchParams["version"] && searchParams["code"])
                        {
                            item = await scrape.fetchItem(searchType,
                                                        searchParams.version,
                                                        searchParams.code);
                        }
                        else
                        {
                            // Scrape item from handbook and insert it into database if found.
                            item = await scrape.singleSearch(searchParams.code,
                                                            "",
                                                            //new Date().getFullYear(),
                                                            searchType);
                        }

                        if (item != null)
                        {
                            qry = "INSERT INTO " + table + " (code, retrievedOn, data)" +
                                " VALUES(?, ?, ?)";
                            db.run(qry, [item.code, getDate(), JSON.stringify(item)], function(error)
                            {
                                if (error)
                                {
                                    console.error(error.message);
                                }
                            });
                        }
                    }

                    // If the item already exists in the database.
                    else
                    {
                        item = JSON.parse(rows[0].data);
                    }
                }

                db.close(function(error)
                {
                    if (error)
                    {
                        console.error(error.message);
                    }
                });

                resolve(item);
            });
        }

        else
        {
            reject("Cannot search without code.");
        }
    });
}

function getDegree(searchDegree)
{
    return new Promise(function(resolve, reject)
    {
        cacheSearch("degree", {"code": searchDegree}).then(function(degree)
        {
            if (degree != null)
            {
                resolve(degree);
            }
            else
            {
                reject("No matching degree could be found.");
            }
        })
        .catch(errorMsg =>
        {
            reject(errorMsg);
        });
    });
}

function getUnit(searchUnit)
{
    return new Promise(function(resolve, reject)
    {
        cacheSearch("unit", {"code": searchUnit}).then(function(unit)
        {
            if (unit != null)
            {
                resolve(unit);
            }
            else
            {
                reject("No matching unit could be found.");
            }
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

function degreeHasMajor(degree, searchMajor)
{
    let result = false;
    // Checks if degree has a curriculum structure.
    if (degree["CurriculumStructure"])
    {
        let degreeStructure = JSON.parse(degree.CurriculumStructure).container;

        // Finds index of element containing all the majors in a degree.
        let index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "MAJOR";
        });
        if (index != -1)
        {
            let majors = degreeStructure[index].relationship;

            // Searches for major matching search input.
            index = scrape.searchJSONArr(majors, function(entry)
            {
                return entry.academic_item_code.toUpperCase() == searchMajor.toUpperCase();
            });
            if (index != -1)
            {
                result = true;
            }
        }
    }

    return result;
}

async function getMajor(searchMajor, degree)
{
    return new Promise(function(resolve, reject)
    {
        // Resolve with details of major.
        cacheSearch("major", {"code": searchMajor}).then(function(major)
        {
            if (major != null)
            {
                if (!degreeHasMajor(degree, searchMajor))
                {
                    major.message = "Degree does not contain major";
                }
                
                resolve(major);
            }
            else
            {
                reject("No matching major could be found.");
            }
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

exports.getSuggestions = getSuggestions;
exports.getDegree = getDegree;
exports.getUnit = getUnit;
exports.getMajor = getMajor;
exports.cacheSearch = cacheSearch;
exports.getAccount = getAccount;
exports.createAccount = createAccount;

