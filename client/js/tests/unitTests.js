/*
 * Runs various unit tests.
 */

var coursePlanHelper = require('../coursePlanHelper.js');
var ruleCheck = require('../ruleCheck.js');

function testHasUnitCode1()
{
    let item = {code: "meow"};

    if(coursePlanHelper.hasUnitCode(item))
    {
        return true;
    }
    return false;
}

function testHasUnitCode2()
{
    let item = {noCode: "woof"};
    if(!coursePlanHelper.hasUnitCode(item))
    {
        return true;
    }

    return false;
}

function testHasUnitCode()
{
    let item1 = {code: "meow"};
    let item2 = {noCode: "woof"};

    console.log("test hasUnitCode 1 success: " + testHasUnitCode1());
    console.log("test hasUnitCode 2 success: " + testHasUnitCode2());
}

function testIsPrereqNode1()
{
    let item1 = {operator: ""};
    
    if(coursePlanHelper.isPrereqNode(item1) == false)
    {
        return true;
    }

    return false;
}

function testIsPrereqNode2()
{
    let item1 = {items: []};
    if(coursePlanHelper.isPrereqNode(item1) == false)
    {
        return true;
    }

    return false;
}

function testIsPrereqNode3()
{
    let item1 = {
        operator: "",
        items: []
    };

    if(coursePlanHelper.isPrereqNode(item1) == true)
    {
        return true;
    }

    return false;
}

function testIsPrereqNode()
{
    console.log("testIsPrereqNode1 returns: " + testIsPrereqNode1());
    console.log("testIsPrereqNode2 returns: " + testIsPrereqNode2());
    console.log("testIsPrereqNode3 returns: " + testIsPrereqNode3());
}

function generateSchedule()
{
    let schedule = [];

    for(let i = 0; i < 3; i++)
    {
        let yr = {
            year: 2000 + i,
            semesters: []
        };
        schedule.push(yr);

        for(let j = 0; j < 2; j++)
        {
            let sem = {
                semester: j + 1,
                units: []
            };
            yr.semesters.push(sem);

            for(let k = 0; k < 4; k++)
            {
                let unit = {
                    code: "ICT" + (100 * (i + 1) + k + (j * 4)),
                    type: "DECIDED",
                    grade: 50,
                    credit_points: 3
                };
                sem.units.push(unit);
            }
        }
    }

    //console.log(JSON.stringify(schedule, null, "\t"));
    return schedule;
}

function generateCoursePlan()
{
    let coursePlan = {
        completed_units: [],
        advanced_standing: {year1CP: 0, year2CP: 0, year3CP: 0},
        schedule: generateSchedule()
    };

    return coursePlan;
}

function testGetPlannedUnitYearSem1()
{
    let schedule = generateSchedule();

    let yearSem = coursePlanHelper.getPlannedUnitYearSem("ICT301", schedule);
    //let yearSem = schedule[1].semesters[1].units.find(element => element.code == "ICT205");
    if(yearSem != null && yearSem.year == 2002 && yearSem.semester == 1)
    {
        return true;
    }
    return false;
}

function testGetPlannedUnitYearSem2()
{
    let schedule = generateSchedule();

    let yearSem = coursePlanHelper.getPlannedUnitYearSem("9", schedule);
    //let yearSem = schedule[1].semesters[1].units.find(element => element.code == "ICT205");
    if(yearSem == null)
    {
        return true;
    }
    return false;
}

function testGetPlannedUnitYearSem3()
{
    let sched = generateSchedule();
    let coursePlan = {schedule: sched};
    (coursePlanHelper.getFullUnit("ICT301", coursePlan)).type = "undecided";
    let yearSem = coursePlanHelper.getPlannedUnitYearSem("ICT301", sched);
    //let yearSem = schedule[1].semesters[1].units.find(element => element.code == "ICT205");
    
    if(yearSem == null)
    {
        return true;
    }
    return false;
}

function testGetPlannedUnitYearSem()
{
    let tests = [
        testGetPlannedUnitYearSem1,
        testGetPlannedUnitYearSem2,
        testGetPlannedUnitYearSem3
    ];

    for(let i = 0; i < tests.length; i++)
    {
        console.log("testGetPlannedUnitYearSem" + (i+1) + " returns: " + tests[i]());
    }
}

function testUnitPassedBeforeYearSem1()
{
    let coursePlan = generateCoursePlan();
    //test for the year and sem the unit is in.
    if(ruleCheck.unitPassedBeforeYearSem("ICT301", 2002, 1, coursePlan) == false)
    {
        return true;
    }
    return false;
}

function testUnitPassedBeforeYearSem2()
{
    let coursePlan = generateCoursePlan();
    //test for the year unit is in, but next sem.
    if(ruleCheck.unitPassedBeforeYearSem("ICT301", 2002, 2, coursePlan) == true)
    {
        return true;
    }
    return false;
}

function testUnitPassedBeforeYearSem3()
{
    let coursePlan = generateCoursePlan();
    //test for the year after the year unit is in, but same sem num.
    if(ruleCheck.unitPassedBeforeYearSem("ICT301", 2003, 1, coursePlan) == true)
    {
        return true;
    }
    return false;
}

function testUnitPassedBeforeYearSem4()
{
    let coursePlan = generateCoursePlan();
    coursePlan.completed_units.push({code: "ICT301", grade: 50});
    //test for the year and sem that unit is in, but unit is already in completed_units and passed (50).
    if(ruleCheck.unitPassedBeforeYearSem("ICT301", 2002, 1, coursePlan) == true)
    {
        return true;
    }
    return false;
}

function testUnitPassedBeforeYearSem5()
{
    let coursePlan = generateCoursePlan();
    coursePlan.completed_units.push({code: "ICT301", grade: 49});
    //test for the year and sem that unit is in, but unit is already in completed_units and not passed (49).
    if(ruleCheck.unitPassedBeforeYearSem("ICT301", 2002, 1, coursePlan) == false)
    {
        return true;
    }
    return false;
}

function testUnitPassedBeforeYearSem6()
{
    let coursePlan = generateCoursePlan();
    coursePlan.completed_units.push({code: "ICT301", grade: 51});
    //test for the year and sem that unit is in, but unit is already in completed_units and passed (51).
    if(ruleCheck.unitPassedBeforeYearSem("ICT301", 2002, 1, coursePlan) == true)
    {
        return true;
    }
    return false;
}

function testUnitPassedBeforeYearSem()
{
    let tests = [
        testUnitPassedBeforeYearSem1,
        testUnitPassedBeforeYearSem2,
        testUnitPassedBeforeYearSem3,
        testUnitPassedBeforeYearSem4,
        testUnitPassedBeforeYearSem5,
        testUnitPassedBeforeYearSem6
    ];

    for(let i = 0; i < tests.length; i++)
    {
        console.log("testUnitPassedBeforeYearSem" + (i+1) + " returns: " + tests[i]());
    }
}

//No advanced standing or passed units
function testTwelvePointsBeforeYearSem1()
{
    let coursePlan = generateCoursePlan();
    if(ruleCheck.twelveCredCompBeforeYearSem(coursePlan, 2000, 1))
    {
        return false;
    }
    return true;
}

//12 advanced standing creds, no passed units
//Checking year 2000 (1st year), sem 1
function testTwelvePointsBeforeYearSem2()
{
    let coursePlan = generateCoursePlan();
    coursePlan.advanced_standing.year1CP = 12;
    if(ruleCheck.twelveCredCompBeforeYearSem(coursePlan, 2000, 1))
    {
        return true;
    }
    return false;
}

//0 advanced standing creds, 12 points of passed units
function testTwelvePointsBeforeYearSem3()
{
    let coursePlan = generateCoursePlan();
    for(let i = 0; i < 8; i++)
    {
        let unit = {grade: 90, credit_points: 3};
        coursePlan.completed_units.push(unit);
    }
    if(ruleCheck.twelveCredCompBeforeYearSem(coursePlan, 2000, 1))
    {
        return true;
    }
    return false;
}

//0 advanced standing creds, 0 points of passed units
//checking for 12 credits after 1 sem of 4 units of 3 cred points
function testTwelvePointsBeforeYearSem4()
{
    let coursePlan = generateCoursePlan();

    if(ruleCheck.twelveCredCompBeforeYearSem(coursePlan, 2000, 2))
    {
        return true;
    }
    return false;
}

//0 advanced standing creds, 0 points of passed units
//checking for 12 credits after 2 sem of 2 units of 3 cred points
function testTwelvePointsBeforeYearSem4()
{
    let coursePlan = generateCoursePlan();

    coursePlan.schedule[0].semesters[0].units.pop();
    coursePlan.schedule[0].semesters[0].units.pop();
    coursePlan.schedule[0].semesters[1].units.pop();
    coursePlan.schedule[0].semesters[1].units.pop();

    if(ruleCheck.twelveCredCompBeforeYearSem(coursePlan, 2001, 1))
    {
        return true;
    }
    return false;
}

function testTwelvePointsBeforeYearSem()
{
    let tests = [
        testTwelvePointsBeforeYearSem1,
        testTwelvePointsBeforeYearSem2,
        testTwelvePointsBeforeYearSem3,
        testTwelvePointsBeforeYearSem4        
    ];

    for(let i = 0; i < tests.length; i++)
    {
        console.log("testTwelvePointsBeforeYearSem" + (i + 1) + " returns " + tests[i]());
    }
}

function runTests()
{
    let testFuncs = [
        testHasUnitCode,
        //testIsPrereqNode,
        testGetPlannedUnitYearSem,
        testUnitPassedBeforeYearSem,
        testTwelvePointsBeforeYearSem
    ];

    for(let i = 0; i < testFuncs.length; i++)
    {
        console.log(testFuncs[i]());
    }
}

//console.log(testHasUnitCode());
console.log(runTests());
//console.log(generateSchedule());