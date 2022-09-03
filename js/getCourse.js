import fetch from "node-fetch";
import rls from "readline-sync";

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

/**
 * Searches through a JSON array for an item that the checkMatch function deems a match.
 * @param {Array} arr JSON array to search.
 * @param {Function} checkMatch Callback that returns whether current item in array matches target.
 * @returns Index of matching array item.
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
    // Extracts JSON from response then sets item to that data.
    });
//    console.log(result);
//    console.log("\n-----------------------------------------\n");
    item = result.json();
    //.then(response => response.json()).then(data => item = data);
    return item;
}

function extractUnits(arr, electiveUnits, mandatoryUnits)
{
    for (let entry of arr)
    {
        for (let unit of entry.relationship)
        {
            // Stores whether unit is elective or mandatory.
            let necessity = unit.parent_connector.label.toUpperCase();
            if (necessity == "OPTIONAL")
            {
                electiveUnits.push({"version": unit.academic_item_version_name, "code": unit.academic_item_code});
            }
            else if (necessity == "MANDATORY")
            {
                mandatoryUnits.push({"version": unit.academic_item_version_name, "code": unit.academic_item_code});
            }
        }
    }
}

function removeDuplicates(arr)
{
    // Stringifies all objects in arr.
    // This is because sets compare objects by their reference, not their values.
    for (let i = 0; i < arr.length; ++i)
    {
        arr[i] = JSON.stringify(arr[i]);
    }
    // Temporarily turns arr into set, removing duplicates in the process.
    arr = Array.from([...new Set(arr)]);
    // Parses all strings in arr back into objects.
    for (let i = 0; i < arr.length; ++i)
    {
        arr[i] = JSON.parse(arr[i]);
    }
    return arr;
}

let thing = [];
/*
async function collectPrerequisites(arr)
{
    let prerequisites = [];

    let contents = [];
    contents = await Promise.all(arr.map(async function(unit)
    {
        contents.push(await fetchItem("murdoch_psubject", unit.version, unit.code));
    })).then(function()
    {
        for (let unit of contents)
        {
            if (unit.contentlets.length > 0)
            {
                console.log(unit.contentlets[0].code);
                thing.push(unit.contentlets[0].code);
            }
        }

        return contents;
    });
    
    for (let j = 0; j < contents.length; ++j)
    {
        if (contents[j].contentlets.length > 0)
        {
            // Contains data such as assessments, requisites, learning outcomes, etc.
            let extraData = JSON.parse(contents[j].contentlets[0].data);
            let requisites = extraData.requisites;
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
        }
    }
    prerequisites = removeDuplicates(prerequisites);

    if (prerequisites.length > 0)
    {
        await collectPrerequisites(prerequisites);
    }
}
*/
let count = 0;
const worker = next_ => async() =>
{
    let next;
    while((next = next_()))
    {
        console.log((await fetchItem("murdoch_psubject", next.version, next.code)).contentlets[0].code);
        ++count;
    }
}
const CONCURRENT_WORKERS = 3;
async function collectPrerequisites(arr)
{
    count = 0;
    let arr2 = [];
    for (let i = 0; i < arr.length; ++i)
    {
        arr2[i] = arr[i];
    }
    const workers = [];
    for (let i = 0; i < CONCURRENT_WORKERS; ++i)
    {
        const w = worker(arr2.pop.bind(arr2));
        workers.push(w(arr2));
    }

    await Promise.all(workers);
    console.log(count);
//    let count = 0;
//    let contents = [];
//    contents = await Promise.allSettled(new Array(18).fill(arr).map(async function(unit)
//    {
//        await fetchItem("murdoch_psubject", unit.version, unit.code);
//        console.log("count: " + ++count);
//        contents.push(await fetchItem("murdoch_psubject", unit.version, unit.code));
//    }));
    //console.log(contents);
}

let index = 0;
let searchDegree = rls.question("Enter a degree code to search: ");
let degree = await getDegree(searchDegree);
let electiveUnits = [];
let mandatoryUnits = [];
if (degree != null)
{
    let degreeStructure = JSON.parse(degree.CurriculumStructure).container;
    // Extracts spine of degree.
    index = searchJSONArr(degreeStructure, function(entry)
    {
        return entry.title.toUpperCase() == "SPINE";
    });
    if (index != -1)
    {
        let spine = degreeStructure[index].container;
        extractUnits(spine, electiveUnits, mandatoryUnits);
    }

    // Extracts course core of degree.
    index = searchJSONArr(degreeStructure, function(entry)
    {
        return entry.title.toUpperCase() == "COURSE CORE";
    });
    if (index != -1)
    {
        let courseCore = degreeStructure[index].container;
        extractUnits(courseCore, electiveUnits, mandatoryUnits);
    }

    // Gets all the majors in a degree.
    index = searchJSONArr(degreeStructure, function(entry)
    {
        return entry.title.toUpperCase() == "MAJOR";
    });
    if (index != -1)
    {
        let majors = degreeStructure[index].relationship;

        let searchMajor = rls.question("Enter a major code to search: ");
        // Searches for major matching search input.
        index = searchJSONArr(majors, function(entry)
        {
            return entry.academic_item_code.toUpperCase() == searchMajor.toUpperCase();
        });

        if (index != -1)
        {
            // Fetches handbook entry for major.
            let major = await fetchItem("murdoch_paos", majors[index].academic_item_version_name, majors[index].academic_item_code);
            // Gets structure of all units in major.
            let majorStructure = JSON.parse(major.contentlets[0].CurriculumStructure).container[0].container;
            extractUnits(majorStructure, electiveUnits, mandatoryUnits);
        }

        else
        {
            console.log("Major not found.");
        }
    }

    electiveUnits = removeDuplicates(electiveUnits);
    mandatoryUnits = removeDuplicates(mandatoryUnits);

    for (let j = 1;true; ++j)
    {
        console.log((await fetchItem("murdoch_psubject", "14", "ICT283")).contentlets[0].code);
        console.log("loop: " + j);
    }
//    for (let j = 0; j < 20; ++j)
//    {
//        await collectPrerequisites(mandatoryUnits);
//        console.log("loop: " + j);
//    }

//    await collectPrerequisites(electiveUnits);
//    thing = Array.from([...new Set(thing)]);
//    await collectPrerequisites(mandatoryUnits);
//    thing = Array.from([...new Set(thing)]);
//    console.log("\nUnits in course:");
//    for (let item of thing)
//    {
//        console.log(item);
//    }
}

else
{
    console.log("Degree not found.");
}
