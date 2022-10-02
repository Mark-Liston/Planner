// database.js

"use strict";

const scrape = require("./scrape.js");
const coursePlan = require("./coursePlan.js");
const planDef = require("./planDef.js");

const sqlite = require("sqlite3").verbose();

const dbPath = "database/Planner.db";

function getSuggestions(type, matchString)
{
    return new Promise(function(resolve, reject)
    {
        let table = type;

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
            let table = type;
            let searchType = "";
            switch (type.toUpperCase())
            {
                case "DEGREE":
                    searchType = ["murdoch_pcourse"];
                    break;
                case "MAJOR":
                    searchType = ["murdoch_paos"];
                    break;
                case "MINOR":
                    searchType = ["murdoch_paos"];
                    break;
                case "CO-MAJOR":
                    searchType = ["murdoch_paos"];
                    break;
                case "UNIT":
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
                    " FROM '" + table + "'" +
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
                            qry = "INSERT INTO '" + table + "' (code, retrievedOn, data)" +
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
        cacheSearch("Degree", {"code": searchDegree}).then(function(degree)
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

function degreeHasOption(degree, searchOption, type)
{
    let result = false;
    // Checks if degree has a curriculum structure.
    if (degree["CurriculumStructure"])
    {
        let degreeStructure = JSON.parse(degree.CurriculumStructure).container;

        // Finds index of element containing all relevant options in a degree.
        let index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == type.toUpperCase();
        });
        if (index != -1)
        {
            let options = degreeStructure[index].relationship;

            // Searches for option matching search input.
            index = scrape.searchJSONArr(options, function(entry)
            {
                return entry.academic_item_code.toUpperCase() == searchOption.toUpperCase();
            });
            if (index != -1)
            {
                result = true;
            }
        }

        // If option isn't in first level of degree's structure
        // i.e., if option is in 'Option' level of structure.
        else
        {
            // Finds index of element containing all option parent objects in
            // a degree e.g., Additional Majors, Recommended Co-Majors,
            // Recommended Minors, General Electives.
            index = scrape.searchJSONArr(degreeStructure, function(entry)
            {
                return entry.title.toUpperCase() == "OPTION";
            });
            if (index != -1)
            {
                let optionStructure = degreeStructure[index].container;
                // Finds index of option parent object.
                index = scrape.searchJSONArr(optionStructure, function(entry)
                {
                    return entry.title.toUpperCase().search(" " + type.toUpperCase()) != -1;
                });
                if (index != -1)
                {
                    let options = optionStructure[index].relationship;

                    // Searches for option matching search input.
                    index = scrape.searchJSONArr(options, function(entry)
                    {
                        return entry.academic_item_code.toUpperCase() == searchOption.toUpperCase();
                    });
                    if (index != -1)
                    {
                        result = true;
                    }
                }
            }
        }
    }

    return result;
}

async function getOption(searchOption, type, degree)
{
    return new Promise(function(resolve, reject)
    {
        // Resolve with details of option.
        cacheSearch(type, {"code": searchOption}).then(function(option)
        {
            if (option != null)
            {
                // For majors and minors, check if they are part of the degree.
                if ((type.toUpperCase() == "MAJOR" || type.toUpperCase() == "MINOR") &&
                    !degreeHasOption(degree, searchOption, type))
                {
                    option.message = "Degree does not contain " + type.toLowerCase();
                }
                resolve(option);
            }
            else
            {
                reject("No matching " + type.toLowerCase() + " could be found.");
            }
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

exports.getSuggestions = getSuggestions;
exports.getDegree = getDegree;
exports.getUnit = getUnit;
exports.getOption = getOption;
exports.cacheSearch = cacheSearch;
