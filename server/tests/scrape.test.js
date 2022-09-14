let scrape = require("../js/scrape.js");

test("Searches handbook for degree", async function()
{
    await expect(scrape.singleSearch("B1390", new Date().getFullYear(), ["murdoch_pcourse"])).not.toBe(null);
});

test("Searches handbook for major", async function()
{
    await expect(scrape.singleSearch("MJ-CMSC", new Date().getFullYear(), ["murdoch_paos"])).not.toBe(null);
});

test("Searches handbook for unit", async function()
{
    await expect(scrape.singleSearch("ICT283", new Date().getFullYear(), ["murdoch_psubject"])).not.toBe(null);
});

test("Searches handbook for multiple items", async function()
{
    await expect((await scrape.searchHandbook("MJ-", new Date().getFullYear(), ["murdoch_paos"], 20)).length).not.toBe(0);
});