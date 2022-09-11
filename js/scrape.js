// scrape.js

"use strict";

let fetch = require("node-fetch");

/**
 * 
 * @param {String} searchParam String normally in search box that is searched for.
 * @param {Date} year Year that items must be available.
 * @param {Array} contentType Type of items to search for. Any combination of:
 * "murdoch_psubject", "murdoch_pcourse", "murdoch_paos".
 * @param {Number} size Number of results to return.
 * @returns JSON object contained search results.
 */
async function searchHandbook(searchParam, year, contentType, size)
{
    let response = null;
    response = await fetch("https://handbook.murdoch.edu.au/api/es/search",
    {
        // Request boilerplate.
        "headers":
        {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json;charset=UTF-8",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors"
        },
        // Actual search query.
        // body does not contain an actual JSON object, just a JSON string. Here, it is written as a JSON
        // object then stringified to improve readability.
        "body": JSON.stringify(
        {
            "query":
            {
                "bool":
                {
                    "must":
                    [
                        {
                            "term":
                            {
                                "live":true
                            }
                        },
                        {
                            "multi_match":
                            {
                                // Search box input.
                                "query": searchParam,
                                "type":"phrase_prefix",
                                "max_expansions":20,
                                // Fields to check the search box input against.
                                "fields":
                                [
                                    "*.code^10",
                                    "*.title^8",
                                    "contenttype"
                                ]
                            }
                        },
                        [
                            {
                                "bool":
                                {
                                    "minimum_should_match":"50%",
                                    "should":
                                    [
                                        {
                                            "query_string":
                                            {
                                                "fields":
                                                [
                                                    "*availableInYears*"
                                                ],
                                                // Year item is available.
                                                "query":"*" + year + "*"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "bool":
                                {
                                    "minimum_should_match":"50%",
                                    "should":
                                    [
                                        {
                                            "query_string":
                                            {
                                                "fields":
                                                [
                                                    "*status*"
                                                ],
                                                // Whether item is active.
                                                "query":"Active"
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    ],
                    "filter":
                    [
                        {
                            "terms":
                            {
                                "contenttype": contentType
                                // [
                                //     "murdoch_psubject",
                                //     "murdoch_pcourse",
                                //     "murdoch_paos"
                                // ]
                            }
                        }
                    ]
                }
            },
            "sort":
            [
                "_score"
            ],
            "from":0,
            // Number of results to return.
            "size": size,
            "track_scores":true,
            "_source":
            {
                "includes":
                [
                    "*.code",
                    "*.name",
                    "*.award_titles",
                    "*.keywords",
                    "urlmap",
                    "contenttype"
                ],
                "excludes":
                [
                    "",
                    null
                ]
            }
        }),
        "method": "POST"
    });

    if (response.ok)
    {
        response = (await response.json()).contentlets;
    }

    return response;
}

/**
 * Performs linear search on given array using provided callback to check equlity.
 * Evaluating equality using a callback means JSON arrays can be searched based
 * on the fields of the objects in the array.
 * @param {Array} arr Array to be searched.
 * @param {Function} checkMatch Callback function that evaluates equality of current item.
 * @returns -1 if the search was unsuccessful, otherwise the index of the found item.
 */
function searchJSONArr(arr, checkMatch)
{
    let targetIndex = -1;
    for (let i = 0; i < arr.length && targetIndex == -1; ++i)
    {
        if (checkMatch(arr[i]))
        {
            targetIndex = i;
        }
    }
    return targetIndex;
}

async function singleSearch(searchParam, year, contentType)
{
    let item = null;
    let data = await searchHandbook(searchParam, year, contentType, 20);
    // Searches for item matching search input.
    let index = searchJSONArr(data, function(entry)
    {
        return entry.code.toUpperCase() == searchParam.toUpperCase(); 
    });

    // If item matching search input is found.
    if (index != -1)
    {
        item = data[index];
    }
    
    return item;
}

exports.searchHandbook = searchHandbook;
exports.singleSearch = singleSearch;