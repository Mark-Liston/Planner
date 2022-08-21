import fetch from "node-fetch";
import rls from "readline-sync";

let found = false;
while (!found)
{
    let searchParam = rls.question("Enter a code to search: ");

    // Searches for the top 20 search results corresponding to the input.
    await fetch("https://handbook.murdoch.edu.au/api/es/search",
    {
        // Request boilerplate.
        "headers":
        {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json;charset=UTF-8",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "Referer": "https://handbook.murdoch.edu.au/search",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        // Actual search query.
        "body": "{\"query\":{\"bool\":{\"must\":[{\"term\":{\"live\":true}},{\"multi_match\":{\"query\":\"" + searchParam + "\",\"type\":\"phrase_prefix\",\"max_expansions\":20,\"fields\":[\"*.code^10\",\"*.title^8\",\"contenttype\"]}},[{\"bool\":{\"minimum_should_match\":\"50%\",\"should\":[{\"query_string\":{\"fields\":[\"*availableInYears*\"],\"query\":\"*2022*\"}}]}},{\"bool\":{\"minimum_should_match\":\"50%\",\"should\":[{\"query_string\":{\"fields\":[\"*status*\"],\"query\":\"Active\"}}]}}]],\"filter\":[{\"terms\":{\"contenttype\":[\"murdoch_psubject\",\"murdoch_pcourse\",\"murdoch_paos\"]}}]}},\"sort\":[\"_score\"],\"from\":0,\"size\":100,\"track_scores\":true,\"_source\":{\"includes\":[\"*.code\",\"*.name\",\"*.award_titles\",\"*.keywords\",\"urlmap\",\"contenttype\"],\"excludes\":[\"\",null]}}",
        "method": "POST"
    }).then(response => response.json()).then(function(data) // Extracts JSON from response and passes that data to callback.
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
                fetch("https://handbook.murdoch.edu.au/api/content/render/false/query/+contentType:murdoch_psubject%20+murdoch_psubject.version:" + version + "%20+murdoch_psubject.code:" + code + "%20+conHost:9e1aa987-69e8-4624-91c2-b31291b29099%20+deleted:false%20+working:true%20+live:true%20+languageId:1%20/orderBy/modDate%20desc",
                {
                    "headers":
                    {
                        "accept": "application/json, text/plain, */*",
                        "accept-language": "en-US,en;q=0.9",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "Referer": "https://handbook.murdoch.edu.au/results/" + version + "/" + code,
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    "body": null,
                    "method": "GET"
                }).then(matchResponse => matchResponse.json()).then(function(matchData)
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