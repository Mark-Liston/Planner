// database.js

"use strict";

const scrape = require("./scrape.js");
const sqlite = require("sqlite3").verbose();

const dbPath = "database/Planner.db";

// Gets today's date in ISO format and removes last 14 chars to isolate yyyy-mm-dd.
function getDate()
{
    return new Date().toISOString().slice(0, -14)
}

function cacheSearch(searchParam, type)
{
    return new Promise(function(resolve, reject)
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
        db.all(qry, [searchParam, getDate()], async function(error, rows)
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
                    // Scrape item from handbook and insert it into database if found.
                    item = await scrape.singleSearch(searchParam,
                                                    new Date().getFullYear(),
                                                    searchType);
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

            //callback(item);
            resolve(item);
        });
    });
}

function getDegree(searchDegree)
{
    return new Promise(function(resolve, reject)
    {
        cacheSearch(searchDegree, "degree").then(function(degree)
        {
            if (degree != null)
            {
                resolve(degree);
            }
            else
            {
                reject("no degree");
            }
        });
    });
}

async function getMajor(searchMajor, degree)
{
    return new Promise(function(resolve, reject)
    {
        resolve(degree);
    });

    // let major = null;
    // let degreeStructure = JSON.parse(degree.CurriculumStructure).container;

    // // Gets all the majors in a degree.
    // let index = scrape.searchJSONArr(degreeStructure, function(entry)
    // {
    //     return entry.title.toUpperCase() == "MAJOR";
    // });
    // if (index != -1)
    // {
    //     let majors = degreeStructure[index].relationship;

    //     // Searches for major matching search input.
    //     index = searchJSONArr(majors, function(entry)
    //     {
    //         return entry.academic_item_code.toUpperCase() == searchMajor.toUpperCase();
    //     });
    //     if (index != -1)
    //     {
    //         // Fetches handbook entry for major.
    //         let major = await fetchItem("murdoch_paos", majors[index].academic_item_version_name, majors[index].academic_item_code);
    //     }
    // }
}

exports.getDegree = getDegree;
exports.getMajor = getMajor;