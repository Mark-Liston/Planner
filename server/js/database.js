// database.js

"use strict";

const scrape = require("./scrape.js");
const coursePlan = require("./coursePlan.js");

const sqlite = require("sqlite3").verbose();

const dbPath = "database/Planner.db";

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
                                                            new Date().getFullYear(),
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
        });
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
                console.log(JSON.parse(degree.CurriculumStructure));
                let structure = JSON.parse(degree.CurriculumStructure);
                let plan =
                {
                    "student_id": 0,
                    "student_name": "",
                    "degree_code": degree.code, 
                    "credit_points":  Number(structure.credit_points),
                    "options":
                    [
                        {
                            "type": "major",
                            "items":
                            [
                                {
                                    "code": "MJ-CMSC",
                                    "credit_points": 0
                                },
                                {
                                    "code": "MJ-MWAD",
                                    "credit_points": 0
                                }
                            ]
                        },
                        {
                            "type": "co-major",
                            "items": [{}]
                        },
                        {
                            "type": "minor",
                            "items": [{}]
                        },
                        {
                            "type": "elective",
                            "quantity": 0,
                            "credit_points": 0
                        }
                    ],
                    "study_load": 12,
                    "completed_credit_points": 0,
                    "planned_credit_points": 0,
                    "completed_units":
                    [
                        {
                            "code": "ICT283",
                            "grade": 69
                        },
                        {
                            "code": "ICT375"
                        }
                    ],
                    "planned_units": [{}],
                    "schedule":
                    [
                        {
                            "year": 2023,
                            "semesters":
                            [
                                {
                                    "semester": 1,
                                    "credit_points": 0,
                                    "units":
                                    [
                                        {
                                            "type": "undecided",
                                            "necessity": "elective",
                                            "credit_points": 0,
                                            "units": [{}]
                                        },
                                        {
                                            "type": "decided",
                                            "necessity": "elective",
                                            "credit_points": 3,
                                            "code": "ICT285"
                                        },
                                        {
                                            "type": "decided",
                                            "necessity": "mandatory",
                                            "credit_points": 3,
                                            "code": "ICT283"
                                        }
                                    ]
                                },
                                {
                                    "semester": 2,
                                    "credit_points": 0,
                                    "units": [{}]
                                }
                            ]
                        },
                        {
                            "year": 2024,
                            "semesters": [{}]
                        }
                    ]
                };
                console.log(JSON.stringify(plan, 2, "  "));

                // TEMP ///////////////////
                let units = 
                {
                    "Degree": coursePlan.getDegreeUnits(degree),
                    "Major": coursePlan.getMajorUnits(major)
                };
                
                if (!degreeHasMajor(degree, searchMajor))
                {
                    units.message = "Degree does not contain major";
                }
                resolve(units);
                ///////////////////////////
            }
            else
            {
                reject("No matching major could be found.");
            }
        });
    });
}

function collectPrerequisites(version, code)
{
    cacheSearch("unit", {"version": version, "code": code}).then(function(unit)
    {
        console.log(code);
        if (unit != null)
        {
            let requisites = JSON.parse(unit.data).requisites;
            let prerequisites = [];
            if (requisites.length > 0)
            {
                // Loops through all kinds of requisites (prerequisites, exclusions).
                for (let req of requisites)
                {
                    if (req.requisite_type.label.toUpperCase() == "PREREQUISITE")
                    {
                        if (req.containers[0].containers.length > 0)
                        {
                            for (let splitReqItem of req.containers[0].containers)
                            {
                                // Adds individual prerequisites to prerequisite array.
                                for (let reqItem of splitReqItem.relationships)
                                {
                                    prerequisites.push({"version": reqItem.academic_item_version_name, "code": reqItem.academic_item_code});
                                }
                            }
                        }
                        // Adds individual prerequisites to prerequisite array.
                        for (let reqItem of req.containers[0].relationships)
                        {
                            prerequisites.push({"version": reqItem.academic_item_version_name, "code": reqItem.academic_item_code});
                        }
                    }
                }
            }

            console.log(prerequisites);
        }
    });
}

exports.getDegree = getDegree;
exports.getMajor = getMajor;
