// coursePlan.js

"use strict";

const scrape = require("./scrape.js");

function extractUnits(arr, units)
{
    for (let entry of arr)
    {
        let temp = [];
        let electiveUnits = [];
        let mandatoryUnits = [];

        for (let unit of entry.relationship)
        {
            // Stores whether unit is elective or mandatory and whether it is AND or OR.
            let necessity = unit.parent_connector;
            if (necessity.label.toUpperCase() == "OPTIONAL")
            {
                electiveUnits.push({"version": unit.academic_item_version_name,
                                    "code": unit.academic_item_code,
                                    "operator": necessity.value});
            }
            else if (necessity.label.toUpperCase() == "MANDATORY")
            {
                mandatoryUnits.push({"version": unit.academic_item_version_name,
                                    "code": unit.academic_item_code,
                                    "operator": necessity.value});
            }
        }

        temp.push({"Elective": electiveUnits});
        temp.push({"Mandatory": mandatoryUnits});
        let groupName = entry.title;
        units.push({groupName: temp});
    }
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
            let temp = [];
            extractUnits(spine, temp);
            units.push({"Spine": temp});
        }

        // Extracts course core of degree.
        index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "COURSE CORE";
        });
        if (index != -1)
        {
            let courseCore = degreeStructure[index].container;
            let temp = [];
            extractUnits(courseCore, temp);
            units.push({"CourseCore": temp});
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
        //console.log(degreeStructure);
        units = [];

        let index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "MAJOR";
        });
        if (index != -1)
        {
            let major = degreeStructure[index].container;
            let temp = [];
            extractUnits(major, temp);
            units.push({"Major": temp});
        }
    }

    return units;
}

exports.getDegreeUnits = getDegreeUnits;
exports.getMajorUnits = getMajorUnits;