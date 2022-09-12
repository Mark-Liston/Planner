// database.js

"use strict";

let scrape = require("./scrape.js");

var sqlite = require("sqlite3").verbose();

// Gets today's date in ISO format and removes last 14 chars to isolate yyyy-mm-dd.
function getDate()
{
    return new Date().toISOString().slice(0, -14)
}

async function getDegree(searchDegree, callback)
{
    let degree = null;

    let db = new sqlite.Database("database/Planner.db", sqlite.OPEN_READWRITE, function(error)
    {
        if (error)
        {
            console.error(error.message);
        }
    });
    
    // Gets any degrees from the last 6 months with a matching code.
    // Degrees are updated every 6 months.
    let qry = "SELECT *" +
            " FROM Degree" +
            " WHERE code = ? AND" +
            " retrievedOn > date(?, '-6 month')" +
            " ORDER BY retrievedOn ASC";
    db.all(qry, [searchDegree, getDate()], async function(error, rows)
    {
        if (error)
        {
            console.error(error.message);
        }

        else
        {
            // If there is no matching degree in the database from the last 6 months.
            if (rows.length == 0)
            {
                // Scrape degree from handbook and insert it into database if found.
                degree = await scrape.singleSearch(searchDegree, new Date().getFullYear(), ["murdoch_pcourse"]);
                if (degree != null)
                {
                    qry = "INSERT INTO Degree (code, retrievedOn, data)" +
                        " VALUES(?, ?, ?)";
                    db.run(qry, [searchDegree, getDate(), JSON.stringify(degree)], function(error)
                    {
                        if (error)
                        {
                            console.error(error.message);
                        }
                    });
                }
            }

            // If the degree already exists in the database.
            else
            {
                degree = JSON.parse(rows[0].data);
            }
        }

        db.close(function(error)
        {
            if (error)
            {
                console.error(error.message);
            }
        });

        callback(degree);
    });
}


exports.getDegree = getDegree;
