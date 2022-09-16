let scrape = require("../js/scrape.js");

test("Searches handbook for degree", async function()
{
    await expect(await scrape.singleSearch("B1390",
                                    new Date().getFullYear(),
                                    ["murdoch_pcourse"])).not.toBe(null);
});

test("Searches handbook for major", async function()
{
    await expect(await scrape.singleSearch("MJ-CMSC",
                                    new Date().getFullYear(),
                                    ["murdoch_paos"])).not.toBe(null);
});

test("Searches handbook for unit", async function()
{
    await expect(await scrape.singleSearch("ICT283",
                                    new Date().getFullYear(),
                                    ["murdoch_psubject"])).not.toBe(null);
});

test("Searches handbook for multiple items", async function()
{
    await expect((await scrape.searchHandbook("MJ-",
                                            new Date().getFullYear(),
                                            ["murdoch_paos"], 20)).length).not.toBe(0);
});

test("Searches handbook for nonexistent item", async function()
{
    await expect(await scrape.singleSearch("sadfaeghsrtherheh12341344325",
                                    new Date().getFullYear(),
                                    ["murdoch_pcourse",
                                    "murdoch_paos",
                                    "murdoch_psubject"])).toBe(null);
});