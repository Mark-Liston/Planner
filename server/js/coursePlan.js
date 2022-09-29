// coursePlan.js

"use strict";

const scrape = require("./scrape.js");
const planDef = require("./planDef.js"); 
const database = require("./database.js");

const util = require("util");

// The last day that a student may enrol for semester 1. This is typically the
// 11 of March.
const lastDayToEnrolS1 = new Date(new Date().getFullYear() + "-03-11");

function extractCode(text)
{
    return text.trim().split(" ")[0];
}

/**
 * Checks whether array is consistent i.e., whether all items in array are
 * identical.
 * @param {Array} arr Array to evaluate the consistency of.
 * @return null if array is consistent. First inconsistent entry in array.
 */
function isArrayConsistent(arr)
{
    let returnVal = null;
    let found = false;
    for (let i = 1; i < arr.length && !false; ++i)
    {
        if (arr[i] != arr[i - 1])
        {
            found = true;
            returnVal = arr[i];
        }
    }
    return returnVal;
}

function generateElectives(units, entry, electives, creditPoints)
{
    let elective = new planDef.UnitSelection();
    elective.type = "undecided"; // Shows that user hasn't decided on which unit to do to satisfy the elective.
    elective.necessity = "elective";
    elective.credit_points = creditPoints[0];
    elective.units = electives; // All the units/options to choose from for the elective.

    // Number of options for the elective.
    let numOfUnits = Math.floor(entry.credit_points / creditPoints[0]);
    // If all array elements are the same = null.
    // If any array elements are different = first inconsistent element.
    let inconsistency = isArrayConsistent(creditPoints);
    if (inconsistency != null)
    {
        // Determines whether there may be more or fewer elective units
        // available for the container.
        // An example of where this would apply is if most of the options for
        // the elective
        let adverb = "more";
        if (inconsistency > elective.credit_points)
        {
            adverb = "fewer";
        }
        elective.notes.push("The parent group of this unit requires " +
            entry.credit_points + " credit points. This has been " +
            "divided into "  +
            numOfUnits + " units. However, some units provide more " +
            "than " +
            elective.credit_points + " credit points. This may allow for " +
            adverb + " units to be selected.");
    }
    // Clones elective for as many electives in the current entry.
    for (let i = 0; i < numOfUnits; ++i)
    {
        units.push(JSON.parse(JSON.stringify(elective)));
    }
}

function extractUnits(arr)
{
    let units = [];
    
    for (let entry of arr)
    {
        // Whether the entry is made up of electives.
        let electivesExist = false;
        // If entry is made up of electives, this stores the optional units
        // for that elective.
        let electives = [];
        // Stores the credit points for each entry in electives[].
        let creditPoints = [];

        for (let unit of entry.relationship)
        {
            // Stores whether unit is elective or mandatory.
            let necessity = unit.parent_connector;
            if (necessity.label.toUpperCase() == "OPTIONAL")
            {
                creditPoints.push(unit.academic_item_credit_points);
                electivesExist = true;

                let shallowUnit = new planDef.ShallowUnit();
                shallowUnit.code = unit.academic_item_code;
                shallowUnit.name = unit.academic_item_name;
                shallowUnit.credit_points = Number(unit.academic_item_credit_points);

                electives.push(shallowUnit);
            }
            else if (necessity.label.toUpperCase() == "MANDATORY")
            {
                let mandatoryUnit = new planDef.Unit();
                mandatoryUnit.type = "decided";
                mandatoryUnit.necessity = "mandatory";
                mandatoryUnit.credit_points = Number(unit.academic_item_credit_points);
                mandatoryUnit.code = unit.academic_item_code;
                mandatoryUnit.title = unit.academic_item_name;

                units.push(mandatoryUnit);
            }
        }
        // If entry contained electives, they are organised and pushed to units.
        if (electivesExist)
        {
            generateElectives(units, entry, electives, creditPoints);
        }
    }
    return units;
}

function getDegreeUnits(degree)
{
    let units = null;

    // Checks if degree has a curriculum structure.
    if (degree["CurriculumStructure"])
    {
        let degreeStructure = JSON.parse(degree.CurriculumStructure).container;
        units = [];

        // Extracts spine of degree.
        let index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "SPINE";
        });
        if (index != -1)
        {
            let spine = degreeStructure[index].container;
            units = extractUnits(spine);
        }

        // Extracts course core of degree.
        index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "COURSE CORE";
        });
        if (index != -1)
        {
            let courseCore = degreeStructure[index].container;
            units = concatArray(units, extractUnits(courseCore));
        }
    }

    return units;
}

function getMajorUnits(major)
{
    let units = null;

    // Checks if degree has a curriculum structure.
    if (major["CurriculumStructure"])
    {
        let degreeStructure = JSON.parse(major.CurriculumStructure).container;
        units = {};

        let index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "MAJOR";
        });
        if (index != -1)
        {
            let major = degreeStructure[index].container;
            units = extractUnits(major);
        }
    }

    return units;
}

function concatArray(arr1, arr2)
{
    for (let entry of arr2)
    {
        arr1.push(entry);
    }
    return arr1;
}

// TODO: Implement functionality for subtracting one array from another.
// Subtracts all the elements in arr1 that are present in arr2.
function subtractArray(arr1, arr2)
{
    return arr1;
}

function getOptions(input, plan, degree)
{
    return new Promise(function(resolve, reject)
    {
        let func = [];

        if (input.majorInput != "")
        {
            // TODO: Remove any duplicates from units in option items.

            func.push(new Promise(function(resolve, reject)
            {
                database.getMajor(extractCode(input.majorInput), degree)
                .then(function(major)
                {
                    if (major["message"])
                    {
                        plan.message += major.message;
                    }

                    // TODO: Change to only make major element if it doesn't
                    // already exist. If it does exist, access option
                    // element with type == 'major'.
                    let majorOption = new planDef.Option();
                    majorOption.type = "major";

                    let major1 = new planDef.OptionItem();
                    major1.code = major.code;
                    major1.name = major.title;
                    major1.credit_points = Number(JSON.parse(major.CurriculumStructure).credit_points);

                    concatArray(plan.planned_units, getMajorUnits(major));

                    majorOption.items.push(major1);
                    plan.options.push(majorOption);
                    resolve();
                })
                .catch(errorMsg =>
                {
                    reject(errorMsg);
                });
            }));
        }

        if (true)
        //if (input.major2Input != "")
        {
            func.push(new Promise(function (resolve, reject)
            {
                //console.log("after");
                resolve();
            }));
        }

        Promise.all(func).then(function()
        {
            resolve();
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

function getSemesters(offerings)
{
    let arr = [];
    // Searches for offering at Murdoch campus for semester 1.
    let sem1Index = scrape.searchJSONArr(offerings, function(entry)
    {
        // display_name for Murdoch campus is written as:
        // MURDOCH-[semester]-[mode]-[start year]-[end year/CURRENT]
        // e.g., MURDOCH-S1-INT-2018-CURRENT, MURDOCH-S2-EXT-2020-2021
        arr = entry.display_name.split("-");
        return arr[0].toUpperCase() == "MURDOCH" &&
        arr[1].toUpperCase() == "S1";
    });

    // Searches for offering at Murdoch campus for semester 2.
    let sem2Index = scrape.searchJSONArr(offerings, function(entry)
    {
        arr = entry.display_name.split("-");
        return arr[0].toUpperCase() == "MURDOCH" &&
        arr[1].toUpperCase() == "S2";
    });

    let semester = "BOTH";
    if (sem1Index != -1 && sem2Index == -1)
    {
        semester = "S1";
    }
    else if (sem1Index == -1 && sem2Index != -1)
    {
        semester = "S2";
    }
    return semester;
}

function generateRequisite(requisiteData)
{
    let requisiteUnit = new planDef.ShallowUnit();
    requisiteUnit.code = requisiteData.academic_item_code;
    requisiteUnit.name = requisiteData.academic_item_name;
    requisiteUnit.credit_points = requisiteData.academic_item_credit_points;

    return requisiteUnit;
}

// Gets prerequisites, including 1 level of nested prerequisites.
function getPrerequisite(requisite)
{
    let prereqNodes = requisite.containers[0];
    let prereq = new planDef.PrerequisiteNode();
    prereq.operator = prereqNodes.parent_connector.value;

    // Loops through all sub-prerequisites, nested within 1 level.
    for (let subContainer of prereqNodes.containers)
    {
        // Gets all units within sub-prerequisite.
        let nodeContainer = new planDef.PrerequisiteNode();
        nodeContainer.operator = subContainer.parent_connector.value;
        for (let prereqData of subContainer.relationships)
        {
            nodeContainer.items.push(generateRequisite(prereqData));
        }
        prereq.items.push(nodeContainer);
    }

    // Loops through all surface prerequisites i.e., units not nested within
    // another prerequisite container.
    for (let node of prereqNodes.relationships)
    {
        prereq.items.push(generateRequisite(node));
    }

    return prereq;
}

function getRequisites(unit, unitData)
{
    let requisites = JSON.parse(unitData.data).requisites;
    if (requisites.length > 0)
    {
        // Loops through all kinds of requisites (prerequisites, exclusions).
        for (let req of requisites)
        {
                let label = req.requisite_type.label.toUpperCase();
                if (label == "PREREQUISITE")
                {
                    // Adds all prerequisites to unit.
                    unit.prerequisites.push(getPrerequisite(req));
                }

                else if (label == "EXCLUSION")
                {
                    // Adds all exclusions to unit.
                    for (let exclusion of req.containers[0].relationships)
                    {
                        unit.exclusions.push(generateRequisite(exclusion));
                    }
                }
        }
    }
    return requisites;
}

function fillUnits(units)
{
    return new Promise(function(resolve, reject)
    {
        let func = [];

        for (let unit of units)
        {
            // If unit position has been assigned a definite unit,
            // i.e., is not an undecided elective.
            if (unit.type.toUpperCase() != "UNDECIDED")
            {
                func.push(new Promise(function(resolve, reject)
                {
                    database.getUnit(unit.code)
                    .then(function(unitData)
                    {
                        if (unitData != null)
                        {
                            let offerings = JSON.parse(unitData.data).unit_offering;
                            // Gets semester when unit is available:
                            // S1, S2, or BOTH.
                            unit.semester = getSemesters(offerings);
                            // Gets level of unit
                            // e.g., ICT159 = 2, ICT283 = 3, ICT302 = 4.
                            unit.level = Number(unitData.level);

                            // Adds all enrolment rules to the unit's 'notes' field.
                            for (let rule of JSON.parse(unitData.data).enrolment_rules)
                            {
                                unit.notes.push(rule.description);
                            }

                            getRequisites(unit, unitData);

                            resolve();
                        }
                    });
                }));
            }
        }
        Promise.all(func).then(function()
        {
            resolve();
        });
    });
}

function aggregateCP(units)
{
    let creditPoints = 0;
    for (let unit of units)
    {
        creditPoints += Number(unit.credit_points);
    }
    return creditPoints;
}

function fillSemester(semester, units, itr)
{
    semester.units.push(units[itr]);
    semester.credit_points += units[itr].credit_points;
    return units[itr].credit_points;
}

function generateSchedule(plan)
{
    // Sorts planned units according to level
    // e.g., ICT100, ICT200, ICT300, ICT400, etc.
    plan.planned_units.sort(function(a, b)
    {
        return a.level - b.level;
    });

    // Arrays for storing units available in semester 1, semester 2, and
    // both semesters.
    let s1Units = [], s2Units = [], bothUnits = [];
    // Iterators for above arrays.
    let s1Itr = 0, s2Itr = 0, bothItr = 0;
    // Sorts units into appropriate semester array.
    for (let unit of plan.planned_units)
    {
        switch(unit.semester)
        {
            case "S1":
                s1Units.push(unit);
                break;
            case "S2":
                s2Units.push(unit);
                break;
            case "BOTH":
                bothUnits.push(unit);
                break;
        }
    }

    // If today is too late to enrol for semester 1, skip to semester 2 for
    // the first year.
    let skipS1 = false;
    if (new Date() > lastDayToEnrolS1)
    {
        skipS1 = true;
    }

    let currentYear = new Date().getFullYear();
    let count = plan.planned_units.length;
    // Loops until there are no units left to schedule or schedule reaches
    // 10 years. It is assumed a student won't study for more than 10 years
    // at a time.
    while (count > 0 && currentYear < new Date().getFullYear() + 10)
    {
        let year = new planDef.Year();
        year.year = currentYear;
        // Semester 1.
        let semester1 = new planDef.Semester();
        semester1.semester = 1;
        if (count > 0 && !skipS1)
        {
            //let semester1 = new planDef.Semester();
            //semester1.semester = 1;

            let semCP = plan.study_load;
            // Adds units available in semester 1 until study load is reached.
            while (s1Itr < s1Units.length &&
                semCP - s1Units[s1Itr].credit_points >= 0 &&
                count > 0)
            {
                semCP -= fillSemester(semester1, s1Units, s1Itr);
                ++s1Itr;
                --count;
            }
            // Adds units available in both semesters until study load is reached.
            while (bothItr < bothUnits.length &&
                semCP - bothUnits[bothItr].credit_points >= 0 &&
                count > 0)
            {
                semCP -= fillSemester(semester1, bothUnits, bothItr);
                ++bothItr;
                --count;
            }
            //year.semesters.push(semester1);
        }
        year.semesters.push(semester1);
        
        // Semester 2.
        let semester2 = new planDef.Semester();
        semester2.semester = 2;
        if (count > 0)
        {
            skipS1 = false;
            //let semester2 = new planDef.Semester();
            //semester2.semester = 2;

            let semCP = plan.study_load;
            // Adds units available in semester 2 until study load is reached.
            while (s2Itr < s2Units.length &&
                semCP - s2Units[s2Itr].credit_points >= 0 &&
                count > 0)
            {
                semCP -= fillSemester(semester2, s2Units, s2Itr);
                ++s2Itr;
                --count;
            }
            // Adds units available in both semesters until study load is reached.
            while (bothItr < bothUnits.length &&
                semCP - bothUnits[bothItr].credit_points >= 0 &&
                count > 0)
            {
                semCP -= fillSemester(semester2, bothUnits, bothItr);
                ++bothItr;
                --count;
            }
            //year.semesters.push(semester2);
        }
        year.semesters.push(semester2);
        plan.schedule.push(year);
        ++currentYear;
    }
}

function generatePlan(input)
{
    return new Promise(function(resolve, reject)
    {
        let plan = new planDef.Plan();
        plan.student_id = input.studentIDInput;
        plan.student_name = "placeholdername"; // Add field for student name.
        plan.study_load = 12; // Add field for study load.
        plan.completed_credit_points = 0;
        plan.completed_units = []; // Add completed units input.
        plan.completed_credit_points = aggregateCP(plan.completed_units);
        
        database.getDegree(extractCode(input.degreeInput))
        .then(function(degree)
        {
            plan.degree_code = degree.code;
            plan.credit_points = Number(JSON.parse(degree.CurriculumStructure).credit_points);
            plan.planned_units = getDegreeUnits(degree);
            
            getOptions(input, plan, degree)
            .then(function()
            {
                // TODO: Subtract completed units from planned units.
                plan.planned_units = subtractArray(plan.planned_units, plan.completed_units);
                // Fills all units with relevant information e.g., semester
                // the unit is available, prerequisites, exclusions.
                return fillUnits(plan.planned_units);
            })
            .then(function()
            {
                plan.planned_credit_points = aggregateCP(plan.planned_units);
                // Schedules all units into years and semesters based on when
                // units are available.
                generateSchedule(plan);
                //console.log(util.inspect(plan.schedule, false, null, true));
                resolve(plan);
            })
            .catch(errorMsg => reject(errorMsg));
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

exports.getDegreeUnits = getDegreeUnits;
exports.getMajorUnits = getMajorUnits;
exports.generatePlan = generatePlan;
