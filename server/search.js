import fetch from "node-fetch";
import rls from "readline-sync";

let found = false;

/** 
 * Searches handbook for items matching given search parameter and year.
 * @param {String} searchParam String normally in search box that is searched for.
 * @param {Date} year Year that item must be available.
 * @param {Function} callback Function called after results are received from search.
 */ 
async function searchHandbook(searchParam, year, size, callback)
{
    await fetch("https://handbook.murdoch.edu.au/api/es/search",
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
                                "contenttype":
                                [
                                    "murdoch_psubject",
                                    "murdoch_pcourse",
                                    "murdoch_paos"
                                ]
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
    // Extracts JSON from response then passes that data to callback.
    }).then(response => response.json()).then(data => callback(data));
}

/**
 * Fetches handbook entry for item with given version and code.
 * @param {Number} version Version number.
 * @param {String} code Item's code e.g., ICT283, MJ-CMSC, MN-NETS.
 * @param {Function} callback Function called after item is fetched.
 */
async function fetchItem(version, code, callback)
{
    fetch("https://handbook.murdoch.edu.au/api/content/render/false/query/+contentType:murdoch_psubject%20+murdoch_psubject.version:" + version + "%20+murdoch_psubject.code:" + code + "%20+deleted:false%20+working:true%20+live:true%20+languageId:1%20/orderBy/modDate%20desc",
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
    // Extracts JSON from response then passes that data to callback.
    }).then(response => response.json()).then(data => callback(data));
}

while (!found)
{
    let searchParam = rls.question("Enter a code to search: ");
    let year = new Date().getFullYear();

    // Searches for 20 results in the handbook matching search parameter and year.
    await searchHandbook(searchParam, year, 20, function(data)
    {
        let results = data.contentlets;
        let allResults = "";
        let i = 0;
        // Searches results until it finds matching unit.
        for (i; i < results.length && !found; ++i)
        {
            // Searches for an exact match.
            found = searchParam.toUpperCase() == results[i].code.toUpperCase();
            // Compiles all search results in a string to be displayed if search fails.
            allResults += results[i].code + "\n";
        }

        if (found)
        {
            --i;
            let version = results[i].version;
            let code = results[i].code;

            console.log("Code: " + results[i].code +
                        "\nTitle: " + results[i].title +
                        "\nCredit Points: " + results[i].creditPoints);

            // If result is a unit, rather than a major, minor, etc.
            if (results[i].contentTypeLabel == "Unit")
            {
                // Gets handbook entry for unit.
                fetchItem(version, code, function(matchData)
                {
                    // Contains data such as assessments, requisites, learning outcomes, etc.
                    let extraData = JSON.parse(matchData.contentlets[0].data);
                    let requisites = extraData.requisites;
                    if (requisites.length > 0)
                    {
                        // Loops through all kinds of requisites (prerequisites, exclusions).
                        for (let req of requisites)
                        {
                            console.log(req.requisite_type.label + "s:");
                            // Prints individual requisite units.
                            for (let reqItem of req.containers[0].relationships)
                            {
                                console.log(reqItem.academic_item_code);
                            }
                        }
                    }
                });
            }
        }

        else
        {
            console.log("A match for '" + searchParam + "' could not be found.");
            if (results.length > 0)
            {
                console.log("Maybe you were searching for one of these:\n" + allResults);
            }

            else
            {
                console.log("");
            }
        }
    });
}