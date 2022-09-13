// coursePlan.js

"use strict";

const scrape = require("./scrape.js");

function extractUnits(arr, units)
{
    for (let entry of arr)
    {
        let groupName = entry.title;
        units[groupName] = [];
        for (let unit of entry.relationship)
        {
            // Stores whether unit is elective or mandatory and whether it is AND or OR.
            let necessity = unit.parent_connector;
            if (necessity.label.toUpperCase() == "OPTIONAL")
            {
                if (!units[groupName].electiveUnits)
                {
                    units[groupName].electiveUnits = [];
                }
                units[groupName].electiveUnits.push({"version": unit.academic_item_version_name,
                                    "code": unit.academic_item_code,
                                    "operator": necessity.value});
            }
            else if (necessity.label.toUpperCase() == "MANDATORY")
            {
                if (!units[groupName].mandatoryUnits)
                {
                    units[groupName].mandatoryUnits = [];
                }
                units[groupName].mandatoryUnits.push({"version": unit.academic_item_version_name,
                                    "code": unit.academic_item_code,
                                    "operator": necessity.value});
            }
        }
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
            if (!units["Spine"])
            {
                units["Spine"] = [];
            }
            extractUnits(spine, units["Spine"]);
        }

        // Extracts course core of degree.
        index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "COURSE CORE";
        });
        if (index != -1)
        {
            let courseCore = degreeStructure[index].container;
            if (!units["CourseCore"])
            {
                units["CourseCore"] = [];
            }
            extractUnits(courseCore, units["CourseCore"]);
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
            if (!units["Major"])
            {
                units["Major"] = [];
            }
            extractUnits(major, units["Major"]);
        }

        // // Extracts spine of degree.
        // let index = scrape.searchJSONArr(degreeStructure, function(entry)
        // {
        //     return entry.title.toUpperCase() == "SPINE";
        // });
        // if (index != -1)
        // {
        //     let spine = degreeStructure[index].container;
        //     if (!units["Spine"])
        //     {
        //         units["Spine"] = [];
        //     }
        //     extractUnits(spine, units["Spine"]);
        // }

        // // Extracts course core of degree.
        // index = scrape.searchJSONArr(degreeStructure, function(entry)
        // {
        //     return entry.title.toUpperCase() == "COURSE CORE";
        // });
        // if (index != -1)
        // {
        //     let courseCore = degreeStructure[index].container;
        //     if (!units["CourseCore"])
        //     {
        //         units["CourseCore"] = [];
        //     }
        //     extractUnits(courseCore, units["CourseCore"]);
        // }
    }

    return units;
}

exports.getDegreeUnits = getDegreeUnits;
exports.getMajorUnits = getMajorUnits;