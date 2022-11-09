// coursePlan.test.js

// Rewire allows non-exported functions to be accessed by outside files.
const rewire = require("rewire");
// Functions in coursePlan can be accessed/called as such:
// coursePlan.__get__("functionName")(parameters);
const coursePlan = rewire("../js/coursePlan.js");
// Replaces console.log in coursePlan.js with an empty function to suppress output.
coursePlan.__set__("console.log", function(){});

test("Code is extracted from handbook item string", async function()
{
    expect(coursePlan.__get__("extractCode")("MJ-CMSC - Computer Science")).toBe("MJ-CMSC");
});

test("Consistent array is consistent", async function()
{
    expect(coursePlan.__get__("isArrayConsistent")(["a", "a", "a", "a", "a"])).toBe(null);
});

test("Inconsistent array is inconsistent", async function()
{
    expect(coursePlan.__get__("isArrayConsistent")(["a", "b", "a", "a", "a"])).not.toBe(null);
});
