// scrape.test.js

// Rewire allows non-exported functions to be accessed by outside files.
const rewire = require("rewire");
// Functions in scrape can be accessed/called as such:
// scrape.__get__("functionName")(parameters);
const scrape = rewire("../js/scrape.js");
// Replaces console.log in scrape.js with an empty function to suppress output.
scrape.__set__("console.log", function(){});

test("Searches handbook for degree", async function()
{
    await expect(await scrape.__get__("singleSearch")("B1390",
        "",
        ["murdoch_pcourse"])).not.toBe(null);
});

test("Searches handbook for major", async function()
{
    await expect(await scrape.__get__("singleSearch")("MJ-CMSC",
        "",
        ["murdoch_paos"])).not.toBe(null);
});

test("Searches handbook for unit", async function()
{
    await expect(await scrape.__get__("singleSearch")("ICT283",
        "",
        ["murdoch_psubject"])).not.toBe(null);
});

test("Searches handbook for multiple items", async function()
{
    await expect((await scrape.__get__("searchHandbook")("MJ-",
        "",
        ["murdoch_paos"], 20)).length).not.toBe(0);
});

test("Searches handbook for nonexistent item", async function()
{
    await expect(await scrape.__get__("singleSearch")("sadfaeghsrtherheh12341344325",
        "",
        ["murdoch_pcourse",
        "murdoch_paos",
        "murdoch_psubject"])).toBe(null);
});
