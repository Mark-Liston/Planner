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
                shallowUnit.credit_points = unit.academic_item_credit_points;

                electives.push(shallowUnit);
            }
            else if (necessity.label.toUpperCase() == "MANDATORY")
            {
                let mandatoryUnit = new planDef.Unit();
                mandatoryUnit.type = "decided";
                mandatoryUnit.necessity = "mandatory";
                mandatoryUnit.credit_points = unit.academic_item_credit_points;
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
        units = {};

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
            units = extractUnits(courseCore);
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
}

// Subtracts all the elements in arr1 that are present in arr2.
function subtractArray(arr1, arr2)
{
    return arr1;
}

function fillUnits(units)
{
    // Initialises objects to be used repeatedly.
    let requisites = null;
    let label = "";

    for (let unit of units)
    {
        if (unit["code"])
        {
            database.cacheSearch("unit", {"code": unit.code}).then(function(unitData)
            {
                if (unitData != null)
                {
                    if (unitData.code == "ICT283")
                    {
                        console.log(unitData);
                    }

                    requisites = JSON.parse(unitData.data).requisites;
                    if (requisites.length > 0)
                    {
                        // Loops through all kinds of requisites (prerequisites, exclusions).
                        for (let req of requisites)
                        {
                            label = req.requisite_type.label.toUpperCase();
                            if (label == "PREREQUISITE")
                            {
                                
                            }

                            else if (label == "EXCLUSION")
                            {

                            }
                        }
                    }
                }
            })
            .catch(errorMsg => console.log(errorMsg));
        }
    }
}

function generatePlan(input)
{
    let plan = new planDef.Plan();
    plan.student_id = input.studentIDInput;
    plan.student_name = "placeholdername"; // Add field for student name.
    plan.degree_code = input.degreeInput;
    plan.study_load = 12; // Add field for study load.
    plan.completed_credit_points = 0;
    plan.completed_units = []; // Add completed units input.
    
    database.getDegree(input.degreeInput)
        .then(function(degree)
        {
            //console.log(degree);
            plan.credit_points = Number(JSON.parse(degree.CurriculumStructure).credit_points);
            plan.planned_units = getDegreeUnits(degree);
            //console.log(plan);

            if (input.majorInput != "")
            {
                // TODO: Remove any duplicates from units in option items.

                database.getMajor(input.majorInput, degree)
                    .then(function(major)
                    {
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
                        //plan.planned_units = plan.planned_units.concat(getMajorUnits(major));

                        majorOption.items.push(major1);
                        plan.options.push(majorOption);
                    })
                    .catch(errorMsg => console.log(errorMsg.toString()));
            }

            // TODO: Subtract completed units from planned units.
            plan.planned_units = subtractArray(plan.planned_units, plan.completed_units);

            fillUnits(plan.planned_units);

            for (let thing of plan.planned_units)
            {
                console.log(thing.code);
            }
            return plan;
        })
        //.then(thing => console.log(plan))//console.log(util.inspect(plan, false, null, true)))
        .catch(errorMsg => console.log(errorMsg.toString()));
}

exports.getDegreeUnits = getDegreeUnits;
exports.getMajorUnits = getMajorUnits;
exports.generatePlan = generatePlan;
