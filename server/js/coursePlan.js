// coursePlan.js

"use strict";

const scrape = require("./scrape.js");
const planDef = require("./planDef.js"); 
const database = require("./database.js");
const { twelvePointsCompCheck, checkPrereqsMet, isAvailableInSemester, prereqsViable } = require("./rules.js");

// For debugging.
//const util = require("util");

/**
 * Extracts code from beginning of handbook item string,
 * e.g., "MJ-CMSC - Computer Science" => "MJ-CMSC".
 * @param {String} text Handbook item string to extract code from.
 * @return Non-whitespace text from beginning of text until the first space;
 * the code of the handbook item.
 */
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

/**
 * Collates all elective options into one entry.
 * @param {Array} units Array storing all units in a set.
 * @param {Object} entry Individual elective unit.
 * @param {Array} electives Elective options to choose from for unit.
 * @param {Array} creditPoints Array storing credit points of all elective options.
 */
function generateElectives(units, entry, electives, creditPoints)
{
    let elective = new planDef.UnitSelection();
    elective.type = "undecided"; // Shows that user hasn't decided on which unit to do to satisfy the elective.
    elective.necessity = "elective";
    elective.credit_points = Number(creditPoints[0]);
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
        // the elective (including the first in the array) are worth 3 points,
        // but one or more options are worth 6 points. By default, the number
        // of electives generated will equal
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
        // Serialises and deserialises to copy object instead of assigning reference.
        units.push(JSON.parse(JSON.stringify(elective)));
    }
}

/**
 * Gets formatted units from given array that can be put into course plan.
 * @param {Array} arr Array containing units to be extracted.
 * @return Array of units in the correct format for course plan.
 */
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

/**
 * Gets units contained in degree.
 * @param {Object} degree Degree in course plan.
 * @return Units contained in degree.
 */
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

/**
 * Gets units in the given option.
 * @param {Object} option Option to extract units from.
 * @param {Object} type Type of option (Major, Minor, Co-Major).
 * @return Units in given option.
 */
function getOptionUnits(option, type)
{
    let units = null;

    // Checks if degree has a curriculum structure.
    if (option["CurriculumStructure"])
    {
        let structure = JSON.parse(option.CurriculumStructure).container;
        units = {};

        let index = scrape.searchJSONArr(structure, function(entry)
        {
            return entry.title.toUpperCase() == type.toUpperCase();
        });
        if (index != -1)
        {
            let optionData = structure[index].container;
            units = extractUnits(optionData);
        }
    }
    return units;
}

/**
 * Adds all elements of arr2 into arr1.
 * @param {Array} arr1 Resulting array to be combined with arr2.
 * @param {Array} arr2 Array to be added to arr1.
 * @return Result of combining given arrays.
 */
function concatArray(arr1, arr2)
{
    for (let entry of arr2)
    {
        arr1.push(entry);
    }
    return arr1;
}

/**
 * Adds formatted option based on user's input into course plan.
 * @param {Object} input User's input regarding option.
 * @param {Object} type Type of option (Major, Minor, Co-Major).
 * @param {Object} plan Course plan.
 * @param {Object} degree Degree in course plan.
 * @return Promise resolve or error message.
 */
function addOption(input, type, plan, degree)
{
    return new Promise(function(resolve, reject)
    {
        database.getOption(extractCode(input), type, degree)
        .then(function(optionData)
        {
            if (optionData["message"])
            {
                plan.message += optionData.message + "\n";
            }

            // Checks if option already exists in plan.
            let option;
            let index = scrape.searchJSONArr(plan.options, function(entry)
            {
                return entry.type.toUpperCase() == type.toUpperCase();
            });
            // If option exists, point to existing object.
            if (index != -1)
            {
                option = plan.options[index];
            }
            // If option doesn't exist, create new object.
            else
            {
                option = new planDef.Option();
                option.type = type.toLowerCase();
                // Adds reference of object to plan's array of options.
                plan.options.push(option);
            }

            let optionItem = new planDef.OptionItem();
            optionItem.code = optionData.code;
            optionItem.name = optionData.title;
            optionItem.credit_points = Number(JSON.parse(optionData.CurriculumStructure).credit_points);

            // Add all option's units to the rest of the plan's units.
            concatArray(plan.planned_units, getOptionUnits(optionData, type));

            option.items.push(optionItem);
            resolve();
        })
        .catch(errorMsg =>
        {
            reject(errorMsg);
        });
    });
}

/**
 * Gets formatted data of user's input options (extra major, minor, co-major, etc.)
 * and inserts it in given course plan.
 * @param {Object} input User's input regarding their course information.
 * @param {Object} plan Course plan.
 * @param {Object} degree Degree in course plan.
 * @return Promise response or error message.
 */
function getOptions(input, plan, degree)
{
    return new Promise(function(resolve, reject)
    {
        let func = [];

        // Adds input major.
        if (input.majorInput != "")
        {
            func.push(addOption(input.majorInput, "major", plan, degree));
        }
        else
        {
            let degreeHasMajor = database.degreeHasOptionCat(degree, "major");
            if (degreeHasMajor)
                reject("Degree " + degree.code + " requires a primary major");
        }

        // Adds all input additional options.
        for (let i = 0; input["extraInput" + i]; ++i)
        {
            // Gets chars before '-' in option code
            // e.g., MJ-CMSC => MJ.
            let prefix = input["extraInput" + i].trim().split("-")[0].toUpperCase();
            let table = "";
            switch (prefix)
            {
                case "MJ":
                    table = "Major";
                    break;
                case "MN":
                    table = "Minor";
                    break;
                case "CJ":
                    table = "Co-Major";
                    break;
                default:
            }

            func.push(addOption(input["extraInput" + i], table, plan, degree));
        }

        Promise.all(func).then(function()
        {
            // Removes duplicate units after all options have been compiled.
            plan.planned_units = plan.planned_units.filter(function(value, index, arr)
            {
                if (value.type.toUpperCase() != "UNDECIDED")
                {
                    // Checks all units after current unit to see if there is
                    // a match. As units are checked sequentially, all units
                    // before current unit are valid and only those after must
                    // be checked.
                    let found = false;
                    for (let i = index + 1; i < arr.length && !found; ++i)
                    {
                        if (arr[i].type.toUpperCase() != "UNDECIDED" &&
                            value.code.toUpperCase() == arr[i].code.toUpperCase())
                            found = true;
                    }
                    return !found;
                }
                else
                    return true;
            });
            resolve();
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

/**
 * Gets string representing semester/s during which a unit is available. Offerings
 * for a unit are stored in the given parameter.
 * @param {Object} offerings Scraped JSON data regarding unit's offerings
 * (campus, mode (internal/external), and semester).
 * @return 'S1' if offerings indicate unit is available in semester 1, 'S2' if
 * available in semester 2, 'BOTH' if available in both semesters.
 */
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

/**
 * Somewhat of a constructor for a shallow unit in a course plan, as it pertains
 * to requisite units. Requisites are not required to store all the information
 * of a typical unit, therefore they are stored as shallow units, storing only
 * essential data. This is to reduce clutter in course plan objects.
 * @parm {Object} requisiteData Scraped JSON data of requisite.
 * @return Shallow unit populated with details in JSON data of requisite.
 */
function generateRequisite(requisiteData)
{
    let requisiteUnit = new planDef.ShallowUnit();
    requisiteUnit.code = requisiteData.academic_item_code;
    requisiteUnit.name = requisiteData.academic_item_name;
    requisiteUnit.credit_points = requisiteData.academic_item_credit_points;

    return requisiteUnit;
}

/**
 * Gets prerequisites from scraped prerequisite data, including 1 level of
 * nested prerequisites (this refers to groups of optional prerequisites,
 * e.g., prerequisites: (ART100 OR MSP100) AND MSP200).
 * @param {Object} requisite Scraped JSON data of prerequisite.
 * @return Object with prerequisite data as it pertains to course plans.
 */
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

/**
 * Populates given unit with prerequisites and exclusions.
 * @param {Object} unit Unit to populate with requisites.
 * @param {Object} unitData Scraped JSON data of given unit.
 * @return Prerequisites and exclusions of given unit.
 */
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

/**
 * Populates details of units in given array. Details such as semester the unit
 * is available, unit level, and text-based enrolment rules.
 * @param {Array} units Array of units to populate with details.
 * @return Promise response or error message.
 */
function fillUnits(units)
{
    return new Promise(function(resolve, reject)
    {
        let func = [];

        for (let unit of units)
        {
            // If unit position has been assigned a definite unit,
            // i.e., is not an undecided elective.
            if (unit?.type.toUpperCase() != "UNDECIDED")
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

/**
 * Aggregates the credit points of all units in given array.
 * @param {Array} units Array of units to sum the credit points of.
 * @return Sum of credit points of all units in given array.
 */
function aggregateCP(units)
{
    let creditPoints = 0;
    for (let unit of units)
    {
        creditPoints += Number(unit.credit_points);
    }
    return creditPoints;
}

/**
 * Retrieves details of given unit and adds it to given array of completed
 * units.
 * @param {Object} doneUnit Unit to be added to array of completed units.
 * @param {Array} doneUnits Array of completed units.
 */
function addDoneUnit(doneUnit, doneUnits)
{
    return new Promise(function(resolve, reject)
    {
        database.getUnit(doneUnit.code)
        .then(function(unit)
        {
            let completedUnit = new planDef.CompletedUnit();
            completedUnit.code = unit.code;
            completedUnit.name = unit.title;
            completedUnit.credit_points = unit.creditPoints;
            completedUnit.grade = doneUnit.grade;

            doneUnits.push(completedUnit);
            resolve();
        })
        .catch(errorMsg =>
        {
            reject(errorMsg);
        });
    });
}

/**
 * Removes passed units from units in course plan.
 * @param {Array} arr1 Array of units in course plan.
 * @param {Array} arr2 Array of completed units. If it contains units with
 * duplicate codes, only the first occurance will be seen.
 */
function subtractDoneUnits(arr1, arr2)
{
    let j = 0;
    let arr1Length = arr1.length;
    let found = false;
    try
    {
        for (let i = 0; i < arr1Length; ++i)
        {
            found = false;
            // Doesn't check undecided units.
            if (arr1[i]?.type?.toUpperCase() != "UNDECIDED")
            {
                // Compares every unit in arr2 with the current arr1 unit
                // until a match is found.
                for (j = 0; j < arr2.length && !found; ++j)
                {
                    // If units match and unit has been successfully completed
                    // (either advanced standing or a grade >= 50%)
                    if(arr1[i].code == arr2[j].code &&
		                (arr2[j].grade == "AS" ||
                        (!isNaN(arr2[j].grade) && arr2[j].grade >= 50)))
                    {
                        found = true;
                        arr1.splice(i, 1);
                        i -= 1;
                        arr1Length = arr1.length;
                    }
                }
            }
        }
    }
    catch(error)
    {
        console.log(error);
    }
}

/**
 * Handles the removal of completed units from course plan.
 * @param {Object} input User's input regarding their completed units
 */
function removeDoneUnits(input)
{
    return new Promise(function(resolve, reject)
    {
        let doneUnits = [];
        let func = [];
        for (let doneUnit of input.done_units)
        {
            func.push(addDoneUnit(doneUnit, doneUnits));
        }
        Promise.all(func).then(function()
        {
            input.course_plan.completed_units = doneUnits;
            subtractDoneUnits(input.course_plan.planned_units, doneUnits);
            generateSchedule(input.course_plan);
            resolve(input.course_plan);
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

/**
 * Checks whether given unit is valid against enrolment rules.
 * @param {Object} unitItem Unit to validate against enrolment rules.
 * @param {Object} semesterItem Semester unit takes place in.
 * @param {Object} yearItem Year unit takes place in.
 * @param {Object} plan Course plan holding unit.
 * @return Whether unit meets enrolment rules.
 */
function meetsRules(unitItem, semesterItem, yearItem, plan)
{
    if(isAvailableInSemester(unitItem, semesterItem.semester) &&
    twelvePointsCompCheck(plan, unitItem, semesterItem, yearItem))       
    {
        //Checks if any set of prerequisites for the unit can be accomplished. If not, the unit
        //is considred valid for the semester and year (to avoid endless loops).
        if(prereqsViable(unitItem, plan))
        {
            if(checkPrereqsMet(plan, unitItem, semesterItem, yearItem))
            {
                return true;
            }
            return false;
        }
        return true;
    }   
    return false;
}

/**
 * Generates schedule from details in course plan.
 * @param {Object} plan Course plan to generate schedule from.
 */
function generateSchedule(plan)
{
    plan.schedule = [];
    // Sorts planned units according to level
    // e.g., ICT100, ICT200, ICT300, ICT400, etc.
    plan.planned_units.sort(function(a, b)
    {
        return a.level - b.level;
    });


    let unscheduledUnits = [];
    
    for(let unit of plan.planned_units)
    {
        if(unit.semester == "S1")
        {
            unscheduledUnits.push(unit);
        }
    }

    for(let unit of plan.planned_units)
    {
        if(unit.semester == "S2")
        {
            unscheduledUnits.push(unit);
        }
    }

    for(let unit of plan.planned_units)
    {
        if(unit.semester == "BOTH")
        {
            unscheduledUnits.push(unit);
        }
    }


    let skipS1 = false;
  
    let currentYear = plan.startYear;
   
    if(plan.startSemester == 2)
    {
        skipS1 = true;
    }

    // Loops until there are no units left to schedule or schedule reaches
    // 10 years. It is assumed a student won't study for more than 10 years
    // at a time.
    while (unscheduledUnits.length > 0 && currentYear < plan.startYear + 10)
    {
        let year = new planDef.Year();
        year.year = currentYear;

        if(!skipS1)
        {
            let semester1 = new planDef.Semester();
            semester1.semester = 1;
            year.semesters.push(semester1);
            skipS1 = false;
        }
        

        let semester2 = new planDef.Semester();
        semester2.semester = 2;
        year.semesters.push(semester2);

        plan.schedule.push(year);

        for(let sem of year.semesters)
        {
            let semPoints = plan.study_load;

            for(let i = 0; i < unscheduledUnits.length; i++)
            {
                //console.log("Year: " + year.year);
                //console.log("Semester: " + sem.semester);
                //console.log("items left: " + unscheduledUnits.length);
                if(semPoints - unscheduledUnits[i].credit_points >= 0 && meetsRules(unscheduledUnits[i], sem, year, plan))
                {
                    sem.units.push(unscheduledUnits[i]);
                    sem.credit_points += unscheduledUnits[i].credit_points;
                    semPoints -= unscheduledUnits[i].credit_points;
                    unscheduledUnits.splice(i, 1);
                    i -= 1;
                }
            }
        }
        currentYear++;
    }
}

/**
 * Populates advanced standing credit points in user's course plan based on
 * their input.
 * @param {Object} input User's input regarding their advanced standing credit
 * points.
 */
function assignAdvancedStanding(input)
{
    let advancedStanding = new planDef.AdvancedStanding();
    if (!isNaN(input.CP_input.year1))
        advancedStanding.year1CP = Number(input.CP_input.year1);
    if (!isNaN(input.CP_input.year2))
        advancedStanding.year2CP = Number(input.CP_input.year2);
    if (!isNaN(input.CP_input.year3))
        advancedStanding.year3CP = Number(input.CP_input.year3);
    input.course_plan.advanced_standing = advancedStanding;
}

/**
 * Generates course plan based on user input.
 * @param {Object} input User's input regarding their course information.
 * @return Promise containing course plan or error message.
 */
function generatePlan(input)
{
    return new Promise(function(resolve, reject)
    {
        let plan = new planDef.Plan();
        plan.student_id = input.studentIDInput;
        plan.student_name = "placeholdername"; // Add field for student name.
        plan.study_load = 12; // Add field for study load.
        plan.completed_credit_points = 0;
        plan.advanced_standing = new planDef.AdvancedStanding();
        plan.completed_units = [];
        plan.completed_credit_points = aggregateCP(plan.completed_units);
        plan.startYear = input.startYear;
        plan.startSemester = input.startSemester;        
        
        database.getDegree(extractCode(input.degreeInput))
        .then(function(degree)
        {
            plan.degree_code = degree.code;
            plan.credit_points = Number(JSON.parse(degree.CurriculumStructure).credit_points);

            getOptions(input, plan, degree)
            .then(function()
            {
                // When options are added to the plan, all duplicate units
                // in planned_units are removed. Here, the degree's units are
                // added after those of the options. This is because some
                // degrees such as D1059 contain multiple of the same unit.
                //
                // A better solution may be to add a field in each unit
                // specifying its parent. Then, when removing duplicates, the
                // program could only remove duplicates from different parents.
                concatArray(plan.planned_units, getDegreeUnits(degree));
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
                // For dubugging; to view the entire JSON of the plan.
                //console.log(util.inspect(plan.schedule, false, null, true));
                resolve(plan);
            })
            .catch(errorMsg => reject(errorMsg));
        })
        .catch(errorMsg => reject(errorMsg));
    });
}

exports.removeDoneUnits = removeDoneUnits;
exports.assignAdvancedStanding = assignAdvancedStanding;
exports.generatePlan = generatePlan;
