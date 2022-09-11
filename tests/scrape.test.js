let scrape = require("../js/scrape.js");

test("Searches handbook for degree", async function()
{
    let searchParam = "B1390";
    let degree = null;
    let data = await scrape.searchHandbook(searchParam, new Date().getFullYear(), ["murdoch_pcourse"], 20);
    // Searches for degree matching search input.
    let index = scrape.searchJSONArr(data.contentlets, function(entry)
    {
        return entry.code.toUpperCase() == searchParam.toUpperCase(); 
    });

    // If degree matching search input is found.
    if (index != -1)
    {
        degree = data.contentlets[index];
    }

    expect(degree).not.toBe(null);
});

test("Searches handbook for major", async function()
{
    // let searchParam = "MJ-CMSC";
    // let item = null;
    // let data = await scrape.searchHandbook(searchParam, new Date().getFullYear(), ["murdoch_paos"], 20);
    // // Searches for item matching search input.
    // let index = scrape.searchJSONArr(data.contentlets, function(entry)
    // {
    //     return entry.code.toUpperCase() == searchParam.toUpperCase(); 
    // });

    // // If item matching search input is found.
    // if (index != -1)
    // {
    //     item = data.contentlets[index];
    // }
    
    expect(scrape.singleSearch("MJ-CMSC", new Date().getFullYear(), ["murdoch_paos"])).not.toBe(null);
});