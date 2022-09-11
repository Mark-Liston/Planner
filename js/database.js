// database.js

"use strict";

let scrape = require("./scrape.js");

var sqlite = require("sqlite3").verbose();

// Gets today's date in ISO format and removes last 14 chars to isolate yyyy-mm-dd.
function getDate()
{
    return new Date().toISOString().slice(0, -14)
}

async function getDegree(searchDegree)
{
    let db = new sqlite.Database("database/Planner.db", sqlite.OPEN_READWRITE, function(error)
    {
        if (error)
        {
            console.error(error.message);
        }
    
        else
        {
            console.log("Connected to the Planner database.");
        }
    });
    
    // Gets any degrees from the last 6 months with a matching code.
    // Degrees are updated every 6 months.
    let qry = "SELECT *" +
            " FROM Degree" +
            " WHERE code = ? AND" +
            " retrievedOn > date(?, '-6 month')" +
            " ORDER BY retrievedOn ASC";
    db.all(qry, [searchDegree, getDate()], function(error, rows)
    {
        if (error)
        {
            console.error(error.message);
        }

        else
        {
            if (rows.length == 0)
            {
                (async function()
                {
                    console.log(await scrape.singleSearch(searchDegree, new Date().getFullYear(), ["murdoch_pcourse"]));
                    console.log(await scrape.searchHandbook("MJ-", new Date().getFullYear(), ["murdasdf"], 20));
                })();
            }
            for (let row of rows)
            {
                console.log(row.code + "    " + row.retrievedOn);
            }
        }
    });

    db.close(function(error)
    {
        if (error)
        {
            console.error(error.message);
        }

        else
        {
            console.log("Closed the database connection.");
        }
    });
}


exports.getDegree = getDegree;
