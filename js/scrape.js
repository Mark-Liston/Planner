// scrape.js

"use strict";

// Latest version of fetch is incompatible with this format.
// Requires node-fetch v2.6.7
let fetch = require("node-fetch");

/**
 * Fetches handbook entry for item with given type, version, and code.
 * @param {String} contentType Type of item e.g., unit (murdoch_pcourse), major (murdoch_paos), degree (murdoch_psubject).
 * @param {String} version Version number.
 * @param {String} code Item's code e.g., ICT283, MJ-CMSC, MN-NETS.
 * @returns Entry for item retrieved from handbook.
 */
async function fetchItem(contentType, version, code)
{
    let item = null;
    let result = await fetch("https://handbook.murdoch.edu.au/api/content/render/false/query/+contentType:" + contentType + "%20+" + contentType + ".version:" + version + "%20+" + contentType + ".code:" + code + "%20+deleted:false%20+working:true%20+live:true%20+languageId:1%20/orderBy/modDate%20desc",
    {
        // Request boilerplate.
        "headers":
        {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors"
        },
        "body": null,
        "method": "GET"
    });
    
    // Extracts JSON from response then sets item to that data.
    return result.json();
}

exports.fetchItem = fetchItem;
