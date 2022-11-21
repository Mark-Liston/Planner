/**
 * Gets the full unit data from a coursePlan.
 * @param unitCode - code for the unit to retrieve.
 * @param coursePlan - the coursePlan to check for the unit.
 * @returns unit data if successful, null if unit is not in coursePlan.
 */
 function getFullUnit(unitCode, coursePlan)
 {
     for(let i = 0; i < coursePlan.schedule.length; i++)
     {
         for(let j = 0; j < coursePlan.schedule[i].semesters.length; j++)
         {
             for(let k = 0; k < coursePlan.schedule[i].semesters[j].units.length; k++)
             {
                 let unit = coursePlan.schedule[i].semesters[j].units[k];
                 if(unit.type.toUpperCase() != "UNDECIDED")
                 {
                     if(unit.code.toUpperCase() == unitCode.toUpperCase())
                     {
                         //console.log("getFullUnit for " + unitCode + " returns " + unit.code);
                         //console.log(unit);
                         return unit;
                     }
                 }
             }
         }
     }
     
     //console.log(unitCode + " not found in coursePlan");
     return null;
 }
 
 /**
  * Checks if an object has a unit code.
  * @param {*} obj The object to check.
  * @returns True if obj has unit code, otherwise false.
  */
 function hasUnitCode(obj)
 {
     try
     {
         obj.code.toUpperCase();
         return true;
     }
     catch
     {
         return false;
     }
 }
 
 /**
  * Returns the year number and semester number that a unit is planned to be studied in.
  * @param {*} unitCode The code for the unit to find.
  * @param {*} schedule The collection of years from a CoursePlan
  * @returns object with year and semester if found, otherwise null
  */
 function getPlannedUnitYearSem(unitCode, schedule)
 {
     for(let i = 0; i < schedule.length; i++)
     {
         for(let j = 0; j < schedule[i].semesters.length; j++)
         {
             for(let k = 0; k < schedule[i].semesters[j].units.length; k++)
             {
                 let unit = schedule[i].semesters[j].units[k];
                 if(unit.type.toUpperCase() != "UNDECIDED")
                 {
                     if(unit.code.toUpperCase() == unitCode.toUpperCase())
                     {
                         //console.log("year: " + schedule[i].year + " sem: " + schedule[i].semesters[j].semester);
                         return {
                             year: schedule[i].year,
                             semester: schedule[i].semesters[j].semester
                         };
                     }
                 }
                 
             }
         }
     }
     
     return null;
 }
 
 /**
  * Returns the total number of credit points a student has gained from Advanced Standing.
  * @param {*} coursePlan The student's course plan.
  * @returns Number
  */
 function getAdvancedStandingPoints(coursePlan)
 {
     let points = coursePlan.advanced_standing.year1CP + coursePlan.advanced_standing.year2CP + coursePlan.advanced_standing.year3CP;
     //console.log(points);
     return points;
 }
 
 /**
  * Returns the total credit points from units the student has been passed.
  * @param {*} coursePlan The student's course plan.
  * @returns Number
  */
 function getPassedUnitCredPoints(coursePlan)
 {
     let passedCred = 0;
     for(let unit of coursePlan.completed_units)
     {
         if(unit.grade == "AdvStnd" || (!isNaN(unit.grade) && unit.grade >= 50))
         {
             passedCred += unit.credit_points;
         }
     }
 
     return passedCred;
 }
 
 /**
  * Returns the total credit points for units that are planned for a student.
  * @param {*} coursePlan The student's course plan.
  * @returns Number
  */
 function getPlannedUnitCredPoints(coursePlan)
 {
     let plannedCred = 0;
     for(let schedYear of coursePlan.schedule)
     {
         for(let schedSem of schedYear.semesters)
         {
             for(let unit of schedSem.units)
             {
                 plannedCred += unit.credit_points;
             }
         }
     }
 
     return plannedCred;
 }
 
 /**
  * Returns the number of credit points that have been completed by a specified year and semester
  * @param {*} coursePlan The student's course plan.
  * @param {*} yearNum The year in which the specified semester lies.
  * @param {*} semNum Function only counts credit points acquired before this semester.
  * @returns Number of credits completed before the specified year and semester.
  */
 function creditsCompByYearSem(coursePlan, yearNum, semNum)
 {
     let compCredPoints = getAdvancedStandingPoints(coursePlan);
     compCredPoints += getPassedUnitCredPoints(coursePlan);
 
     for(let i = 0; i < coursePlan.schedule.length && coursePlan.schedule[i].year <= yearNum; i++)
     {
         for(let sem of coursePlan.schedule[i].semesters)
         {
             if(coursePlan.schedule[i].year == yearNum && sem.semester >= semNum)
             {
                 break;
             }
 
             for(let unit of sem.units)
             {
                 compCredPoints += unit.credit_points;
             }
         }
     }
 
     return compCredPoints;
 }

/**
 * Checks if a unit is available in a semester.
 * @param unit - unit from a coursePlan
 * @param semesterNum - an int
 * @returns true if unit is available in the semester, otherwise false. UNDECIDED units return true for any semester.
 */
 function isAvailableInSemester(unit, semesterNum)
 {
     let available = false;
     
     if(unit.type.toUpperCase() == "UNDECIDED")
     {
         available = true;
     }
     else if(unit.semester == "BOTH" && (semesterNum == 1 || semesterNum == 2))
     {
         available = true;
     }
     else if(unit.semester == "S1" && semesterNum == 1)
     {
         available = true;
     }
     else if(unit.semester == "S2" && semesterNum == 2)
     {
         available = true;
     }
     
     //console.log("unit.code: " + unit.code + "; unit.semester: " + unit.semester + "; returns: " + available + " for semesterNum: " + semesterNum);
     return available;
 }
 
 /**
  * Checks if a unit has been passed before a particular semester.
  * @param {*} unitCode The unit to check
  * @param {*} yearNum The year in which the semester occurrs.
  * @param {*} semNum The semester number.
  * @param {*} coursePlan The course plan to check for the unit.
  * @returns True if the unit has been passed before the specified semester.
  */
 function unitPassedBeforeYearSem(unitCode, yearNum, semNum, coursePlan)
 {
     //Check if unit is in completed units and has been passed.
     let unit = coursePlan.completed_units.find(({code}) => code == unitCode);
     if(unit != undefined && (unit.grade == "AdvStnd" || (!isNaN(unit.grade) && unit.grade >= 50))){ return true; }
     
     //Check if unit is planned for a semester before the one of interest
     let yearSem = getPlannedUnitYearSem(unitCode, coursePlan.schedule);
     if(yearSem != null)
     {
         if(yearSem.year < yearNum)
         {
             return true;
         }
         else if(yearSem.year == yearNum && yearSem.semester < semNum)
         {
             return true;
         }
     }
     
     return false;
 }

 function unitInSchedule(unitItem, coursePlan)
 {
    for(let unit of coursePlan.planned_units)
    {
        if(unit.type.toUpperCase() == "DECIDED")
        {
            if(unitItem.code.toUpperCase() == unit.code.toUpperCase())
            {
                return true;
            }
        }
    }

    return false;
 }

function prereqIsViable(prereq, coursePlan)
{
    if(hasUnitCode(prereq))
    {
        //Check if unit is in completed units
        let unit = coursePlan.completed_units.find(({code}) => code == prereq.code);
        if(unit != undefined && (unit.grade == "AdvStnd" || (!isNaN(unit.grade) && unit.grade >= 50))){ return true; }

        for(let plannedUnit of coursePlan.planned_units)
        {
            if(hasUnitCode(plannedUnit) && plannedUnit.code == prereq.code)
            {
                return true;
            }
        }

        return false;
    }
    else
    { 
        if(prereq.operator.toUpperCase() == "AND")
        {
            for(let item of prereq.items)
            {
                if(!prereqIsViable(item, coursePlan))
                {
                    return false;
                }
            }
            return true;
        }
        else
        {
            for(let item of prereq.items)
            {
                if(prereqIsViable(item, coursePlan))
                {
                    return true;
                }
            }
            return false;
        }
    }
}

//Checks to see if a viable prerequisite group for a unit is actually amongst the completed or scheduled units.
function prereqsViable(unitItem, coursePlan)
{
    if(unitItem.type.toUpperCase() != "UNDECIDED")
    {
        let prereqs = unitItem.prerequisites;

        if(prereqs.length > 0)
        {
            for(let prereq of prereqs)
            {
                if(prereqIsViable(prereq, coursePlan))
                {
                    return true;
                }
            }

            return false;
        }
    }

    return true;
}


 /**
  * Checks if a prerequisite is satisfied by a certain semester.
  * @param {*} prereqItem The prerequisite to check. Can be a prereqNode or a unit
  * @param {*} plannedYearNum The year the semester is in
  * @param {*} plannedSemNum The semester number the prerequisite is to be satisfied before
  * @param {*} coursePlan A course plan containing completed units and a schedule
  * @returns True if the prerequisite is satisfied by the specified semester, otherwise false.
  */
 function prereqItemMet(prereqItem, plannedYearNum, plannedSemNum, coursePlan)
 {
     //console.log("prereqItemMet checking:");
     //console.log(prereqItem);
     //Check if prereqItem is a unit
     if(hasUnitCode(prereqItem))
     {        
        if(unitPassedBeforeYearSem(prereqItem.code, plannedYearNum, plannedSemNum, coursePlan))
        {
            //console.log("prereqItem " + prereqItem.code + " satisfied");
            return true;
        }
         
         //console.log("prereqItem " + prereqItem.code + " not satisfied");
         return false;
     }
     else //prereqItem is a prereqNode
     {
         //If operator is AND, all prerequisite items must be satisfied
         if(prereqItem.operator.toUpperCase() == "AND")
         {
             for(let item in prereqItem.items)
             {
                 if(!prereqItemMet(prereqItem.items[item], plannedYearNum, plannedSemNum, coursePlan))
                 {
                     //console.log("AND prereq not satisfied; prereqItemMet returns false");
                     return false;
                 }
             }
             
             //console.log("AND prereq satisfied; prereqItemMet returns true");
             return true;
         }
         else //operator is OR, so only one prereq item need be satisfied
         {
             for(let item in prereqItem.items)
             {
                 if(prereqItemMet(prereqItem.items[item], plannedYearNum, plannedSemNum, coursePlan))
                 {
                     //console.log("OR prereq satisfied; prereqItemMet returns true");
                     return true;
                 }
             }
             
             //console.log("OR prereq not satisfied; prereqItemMet returns false");
             return false;
         }
     }
 }
 
 
 /**
  * Checks if a specified amount of credit points has been met before a specified year and semester.
  * @param {*} coursePlan Student's course plan.
  * @param {*} yearNum The year containing the specified semester.
  * @param {*} semNum The semester of the year that the credits should have been accrued by.
  * @param {*} creditReq The number of credit points that should have been accumulated.
  * @returns True if the specified number of credits have been accumulated before the specified year and semester.
  */
 function creditReqMetByYearSem(coursePlan, yearNum, semNum, creditReq)
 {
     if(creditsCompByYearSem(coursePlan, yearNum, semNum) >= creditReq)
     {
         return true;
     }
     return false;
 }
 
 //Checks if the dragged unit is available in the semester it was moved to.
//Returns true, false, or null.
function checkSemAvailability(coursePlan, unitItem, semesterItem)
{
	// grab unit info
    let unit_code = unitItem.code;
	let unit_type = unitItem.type;

    // grab the semester of the current unitItem
	let plannedSem = semesterItem.semester;

    // undecided units are automatically available
	let available = false;	
	if(unit_type.toUpperCase() == "UNDECIDED")
	{
		available = true;
	}
	else
	{
		//Get all the data for the unit from the course plan.
		let fullUnit = getFullUnit(unit_code, coursePlan);
	
		if(fullUnit != null)
		{
			if(isAvailableInSemester(fullUnit, plannedSem))
			{
				available = true;
			}
		}
		else
		{
			available = null;
		}
	}
	
	////console.log("checkSemAvailability for "+ unit_code + " in sem " + plannedSem + " returns: " + available);
	return available;
}

//Checks if the prerequisites for the dragged item are satisfied in its new location
function checkPrereqsMet(coursePlan, unitItem, semesterItem, yearItem)
{
    // grab unit info
    //let unit_code = unitItem.code;
    let unit_type = unitItem.type;

    if(unit_type.toUpperCase() != "UNDECIDED")
	{

        //Get the year and semester the item has been dragged to
        let toYear = yearItem.year;
        let toSem = semesterItem.semester;;

        //Get the unit's prerequisites
        let preReqs = unitItem.prerequisites;

        //prereqs is an array of prereqNode, which in turn contains
        //other prereqNodes and units.
        //Assumption: relationship between top-level prereqNodes in array is
        //"OR", i.e. only one top-level prereqNode need be satisfied.
        if(preReqs.length > 0)
        {
            for(let prereq in preReqs)
            {
                if(prereqItemMet(preReqs[prereq], toYear, toSem, coursePlan))
                {
                    ////console.log("checkPrereqsMet for" + unit_code + " returns true");
                    return true;
                }
            }
            ////console.log("checkPrereqsMet for " + unit_code + " returns false");
            return false;
        }
        ////console.log("checkPrereqsMet: " + unit_code + " has no prereqs; checkPrereqsMet returns true");
        return true;
        
	}
    // //console.log("checkPrereqsMet: undecided elective has no prereqs");
    return true;
}

function twelvePointsCompCheck(coursePlan, unitItem, semesterItem, yearItem)
{
    //console.log("unit item is: " + unitItem.code);
    if(unitItem.type.toUpperCase() != "UNDECIDED")
    {
        if(parseInt(unitItem.code[unitItem.code.search(/[0-9]/)]) > 1)
        {
            return creditReqMetByYearSem(coursePlan, yearItem.year, semesterItem.semester, 12);
        }
    }
    
    return true;
}

exports.checkSemAvailability = checkSemAvailability;
exports.checkPrereqsMet = checkPrereqsMet;
exports.twelvePointsCompCheck = twelvePointsCompCheck;
exports.isAvailableInSemester = isAvailableInSemester;
exports.prereqItemMet = prereqItemMet;
exports.prereqsViable = prereqsViable;
