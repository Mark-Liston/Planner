// scrape.js

"use strict";

let fetch = require("node-fetch");

async function searchHandbook(searchParam, year, contentType, size)
{
    let result = null;
    result = await fetch("https://handbook.murdoch.edu.au/api/es/search",
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
    // Extracts JSON from response then sets result to that data.
    });
    console.log(result);
    result = result.json();
    return result;
}

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

async function getDegree(searchDegree)
{
    let degree = null;
    let data = await searchHandbook(searchDegree, new Date().getFullYear(), ["murdoch_pcourse"], 20);
    // Searches for degree matching search input.
    let degreeIndex = searchJSONArr(data.contentlets, function(entry)
    {
        return entry.code.toUpperCase() == searchDegree.toUpperCase(); 
    });

    // If degree matching search input is found.
    if (degreeIndex != -1)
    {
        degree = data.contentlets[degreeIndex];
    }
    return degree;
}

exports.getDegree = getDegree;
