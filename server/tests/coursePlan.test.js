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

test("Arrays can be concatenated", async function()
{
    expect(coursePlan.__get__("concatArray")(["a", "b", "c"], ["d", "e", "f"]))
        .toStrictEqual(["a", "b", "c", "d", "e", "f"]);
});

test("Unit with semester 1 offering is available for semester 1", async function()
{
    expect(coursePlan.__get__("getSemesters")([{display_name: "MURDOCH-S1-INT-2022-CURRENT"}])).toBe("S1");
});

test("Unit with semester 1 offering is not available for semester 2 or both", async function()
{
    expect(coursePlan.__get__("getSemesters")([{display_name: "MURDOCH-S1-INT-2022-CURRENT"}])).not.toBe("S2");
    expect(coursePlan.__get__("getSemesters")([{display_name: "MURDOCH-S1-INT-2022-CURRENT"}])).not.toBe("BOTH");
});

test("Unit with semester 2 offering is available for semester 2", async function()
{
    expect(coursePlan.__get__("getSemesters")([{display_name: "MURDOCH-S2-INT-2022-CURRENT"}])).toBe("S2");
});

test("Unit with semester 2 offering is not available for semester 1 or both", async function()
{
    expect(coursePlan.__get__("getSemesters")([{display_name: "MURDOCH-S2-INT-2022-CURRENT"}])).not.toBe("S1");
    expect(coursePlan.__get__("getSemesters")([{display_name: "MURDOCH-S2-INT-2022-CURRENT"}])).not.toBe("BOTH");
});

test("Credit points are aggregated", async function()
{
    expect(coursePlan.__get__("aggregateCP")([{credit_points: 3}, {credit_points: 6},
        {credit_points: 9}])).toBe(18);
});

test("Completed units are removed from array of units", async function()
{
    let units = [
        {code: "ICT100"},
        {code: "ICT159"},
        {code: "ICT283"},
        {code: "ICT302"},
        {code: "MAS162"},
        {type: "undecided"},
        {code: "ICT201"},
        {type: "undecided"},
        {code: "ICT376"}
    ];
    let doneUnits = [
        {code: "ICT159", grade: 50},
        {code: "ICT302", grade: 80},
        {code: "ICT201", grade: 39},
        {code: "ICT376", grade: 71}
    ];
    
    coursePlan.__get__("subtractDoneUnits")(units, doneUnits);
    expect(units).toStrictEqual([
        {code: "ICT100"},
        {code: "ICT283"},
        {code: "MAS162"},
        {type: "undecided"},
        {code: "ICT201"},
        {type: "undecided"}
    ]);
});

test("Advanced standing credit points are added to course plan", async function()
{
    let input = {
        CP_input: {year1: "3", year2: "6", year3: "0"},
        course_plan: {advanced_standing: null}
    };
    coursePlan.__get__("assignAdvancedStanding")(input);
    expect(input.course_plan.advanced_standing).toEqual({
        year1CP: 3, year2CP: 6, year3CP: 0
    });
});
