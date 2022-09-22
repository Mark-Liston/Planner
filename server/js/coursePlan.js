// coursePlan.js

"use strict";

const scrape = require("./scrape.js");
const planDef = require("./planDef.js"); 
const database = require("./database.js");

const util = require("util");

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
                database.getMajor(input.majorInput, degree)
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
                    .catch(function(errorMsg)
                    {
                        reject(errorMsg.toString());
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
        });
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
                    let prereqNodes = req.containers[0];
                    let prereq = new planDef.PrerequisiteNode();
                    prereq.operator = prereqNodes.parent_connector.value;

                    for (let subContainer of prereqNodes.containers)
                    {
                        let nodeContainer = new planDef.PrerequisiteNode();
                        nodeContainer.operator = subContainer.parent_connector.value;
                        for (let prereqData of subContainer.relationships)
                        {
                            let prereqUnit = new planDef.ShallowUnit();
                            prereqUnit.code = prereqData.academic_item_code;
                            prereqUnit.name = prereqData.academic_item_name;
                            prereqUnit.credit_points = prereqData.academic_item_credit_points;

                            nodeContainer.items.push(prereqUnit);
                        }
                        prereq.items.push(nodeContainer);
                    }
                    for (let node of prereqNodes.relationships)
                    {

                        let prereqUnit = new planDef.ShallowUnit();
                        prereqUnit.code = node.academic_item_code;
                        prereqUnit.name = node.academic_item_name;
                        prereqUnit.credit_points = node.academic_item_credit_points;

                        prereq.items.push(prereqUnit);
                    }

                    unit.prerequisites.push(prereq);
                }

                else if (label == "EXCLUSION")
                {
                    for (let exclusion of req.containers[0].relationships)
                    {
                        let excUnit = new planDef.ShallowUnit();
                        excUnit.code = exclusion.academic_item_code;
                        excUnit.name = exclusion.academic_item_name;
                        excUnit.credit_points = exclusion.academic_item_credit_points;

                        unit.exclusions.push(excUnit);
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
                                unit.semester = getSemesters(offerings);

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
        
        database.getDegree(input.degreeInput)
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
                        return fillUnits(plan.planned_units);
                    })
                    .then(function()
                    {
                        plan.planned_credit_points = aggregateCP(plan.planned_units);
                        //console.log(plan);
                        //console.log(util.inspect(plan.planned_units, false, null, true));
                        resolve(plan);
                    });

                //    let temp = plan.planned_units;
                //    let currentYear = 2022;
                //    while (temp.length != 0/* && currentYear != 2025*/)
                //    {
                //        let year = new planDef.Year();
                //        year.year = ++currentYear;
                //        while (year.semesters.length < 2 && temp.length != 0)
                //        {
                //            let semester = new planDef.Semester();
                //            semester.semester = year.semesters.length + 1;

                //            // TODO: Make this work with remaining CP in semester.
                //            let semCP = plan.study_load;
                //            while (semCP != 0 && temp.length != 0)
                //            {
                //                let popUnit = temp.shift();
                //                semester.units.push(popUnit);
                //                semCP -= Number(popUnit.credit_points);

                //                semester.credit_points += Number(popUnit.credit_points);
                //            }
                //            //console.log(semester);
                //            year.semesters.push(semester);
                //        }
                //        plan.schedule.push(year);
                //    }

                //    console.log(util.inspect(plan, false, null, true));
                //    resolve(plan);

                //    //for (let thing of plan.planned_units)
                //    //{
                //    //    console.log(thing.code);
                //    //}
                //    //console.log(plan);
                //    //resolve(plan);
            })
            //.then(thing => console.log(plan))//console.log(util.inspect(plan, false, null, true)))
            .catch(errorMsg => reject(errorMsg.toString()));
    });
}

exports.getDegreeUnits = getDegreeUnits;
exports.getMajorUnits = getMajorUnits;
exports.generatePlan = generatePlan;
