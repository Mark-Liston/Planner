// coursePlan.js

"use strict";

const scrape = require("./scrape.js");
const planDef = require("./planDef.js"); 

const util = require("util");

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

function extractUnits(arr, units)//electiveUnits, mandatoryUnits)
{
    let things = [];
    for (let entry of arr)
    {
        let createElective = false;
        let creditPoints = [];
        let electives = [];

        for (let unit of entry.relationship)
        {
            // Stores whether unit is elective or mandatory and whether it is AND or OR.
            let necessity = unit.parent_connector;
            if (necessity.label.toUpperCase() == "OPTIONAL")
            {
                creditPoints.push(unit.academic_item_credit_points);
                createElective = true;
                if (!units.hasOwnProperty("elective_units"))
                {
                    units.elective_units = [];
                }

                let shallowUnit = new planDef.ShallowUnit();
                shallowUnit.code = unit.academic_item_code;
                shallowUnit.name = unit.academic_item_name;
                shallowUnit.credit_points = unit.academic_item_credit_points;

                electives.push(shallowUnit);
            }
            else if (necessity.label.toUpperCase() == "MANDATORY")
            {
                if (!units.hasOwnProperty("mandatory_units"))
                {
                    units.mandatory_units = [];
                }

                let mandatoryUnit = new planDef.Unit();
                mandatoryUnit.type = "decided";
                mandatoryUnit.necessity = "mandatory";
                mandatoryUnit.credit_points = unit.academic_item_credit_points;
                mandatoryUnit.code = unit.academic_item_code;
                mandatoryUnit.title = unit.academic_item_name;

                things.push(mandatoryUnit);
            }
        }
        if (createElective)
        {
            let elective = new planDef.UnitSelection();
            elective.type = "undecided";
            elective.necessity = "elective";
            elective.credit_points = creditPoints[0];
            elective.units = electives;

            // Number of options for the elective.
            let numOfUnits = Math.floor(entry.credit_points / creditPoints[0]);
            // If all array elements are the same = null.
            // If any array elements are different = first inconsistent element.
            let inconsistency = isArrayConsistent(creditPoints);
            if (inconsistency != null)
            {
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
                things.push(JSON.parse(JSON.stringify(elective)));
            }
        }
    }
    for (let i = 0; i < things.length; ++i)
    {
        console.log(things[i].code + "      " + things[i].credit_points);
    }
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
            //console.log(spine[0]);
            extractUnits(spine, units);// electiveUnits, mandatoryUnits);
        }

        // Extracts course core of degree.
        index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "COURSE CORE";
        });
        if (index != -1)
        {
            let courseCore = degreeStructure[index].container;
            extractUnits(courseCore, units);//electiveUnits, mandatoryUnits);
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
            extractUnits(major, units);
        }
    }

    return units;
}

exports.getDegreeUnits = getDegreeUnits;
exports.getMajorUnits = getMajorUnits;
