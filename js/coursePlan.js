// coursePlan.js

"use strict";

const scrape = require("./scrape.js");

function extractUnits(arr, units)
{
    for (let entry of arr)
    {
        for (let unit of entry.relationship)
        {
            // Stores whether unit is elective or mandatory.
            let necessity = unit.parent_connector.label.toUpperCase();
            if (necessity == "OPTIONAL")
            {
                units.electiveUnits.push({"version": unit.academic_item_version_name,
                                    "code": unit.academic_item_code});
            }
            else if (necessity == "MANDATORY")
            {
                units.mandatoryUnits.push({"version": unit.academic_item_version_name,
                                    "code": unit.academic_item_code});
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
        units = {"electiveUnits": [], "mandatoryUnits": []};

        // Extracts spine of degree.
        let index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "SPINE";
        });
        if (index != -1)
        {
            let spine = degreeStructure[index].container;
            extractUnits(spine, units);
        }

        // Extracts course core of degree.
        index = scrape.searchJSONArr(degreeStructure, function(entry)
        {
            return entry.title.toUpperCase() == "COURSE CORE";
        });
        if (index != -1)
        {
            let courseCore = degreeStructure[index].container;
            extractUnits(courseCore, units);
        }
    }

    return units;
}

exports.getDegreeUnits = getDegreeUnits;