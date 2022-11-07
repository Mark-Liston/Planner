//Needed this for testing
//var coursePlanHelper = require('./coursePlanHelper.js');

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
	
	console.log("unit.code: " + unit.code + "; unit.semester: " + unit.semester + "; returns: " + available + " for semesterNum: " + semesterNum);
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
	if(unit != undefined && unit.grade >= 50){ return true; }
	
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
	console.log("prereqItemMet checking:");
	console.log(prereqItem);
	//Check if prereqItem is a unit
	if(hasUnitCode(prereqItem))
	{
		if(unitPassedBeforeYearSem(prereqItem.code, plannedYearNum, plannedSemNum, coursePlan))
		{
			console.log("prereqItem " + prereqItem.code + " satisfied");
			return true;
		}
		
		console.log("prereqItem " + prereqItem.code + " not satisfied");
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
					console.log("AND prereq not satisfied; prereqItemMet returns false");
					return false;
				}
			}
			
			console.log("AND prereq satisfied; prereqItemMet returns true");
			return true;
		}
		else //operator is OR, so only one prereq item need be satisfied
		{
			for(let item in prereqItem.items)
			{
				if(prereqItemMet(prereqItem.items[item], plannedYearNum, plannedSemNum, coursePlan))
				{
					console.log("OR prereq satisfied; prereqItemMet returns true");
					return true;
				}
			}
			
			console.log("OR prereq not satisfied; prereqItemMet returns false");
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

function studyOverloadCheck(coursePlan){
	let overloadedSems = [];

	for(let i = 0; i < coursePlan.schedule.length; i++)
	{
		for(let j = 0; j < coursePlan.schedule[i].semesters.length; j++)
		{
			if(coursePlan.schedule[i].semesters[j].units.length >= 5){
				overloadedSems.push({year: i, sem:j});
			}
		}
	}
	return overloadedSems;
}

/* Needed these for testing:
exports.creditReqMetByYearSem = creditReqMetByYearSem;
exports.unitPassedBeforeYearSem = unitPassedBeforeYearSem;
*/

/**
 * Checks if the plan has only 30 CP of level 100 units (ICT100, ICT159, etc). 
 * Any others units must be higher level than 100 (ICT267, ICT374, etc.).
 * Also to enrol units higher than level 100. Must have achieved 12CP.
 * @param {*} coursePlan The course plan to check planned and completed units.
 * @returns the number of credit points of level 100 units
 */
function unit100_30ptsRule(coursePlan)
{
	let totalCP = 0;

	// Completed Units
	coursePlan.completed_units.forEach(function(unitItem)
	{
		if(unitItem.code.charAt(3) == '1')
		{
			totalCP += parseInt(unitItem.credit_points);
			console.log(unitItem.code + ' is a level 100 unit');

		}
	
	});

	// Planned Units
	coursePlan.planned_units.forEach(function(unitItem)
	{
		if (unitItem.type.toUpperCase() == "DECIDED")
		{
			if(unitItem.code.charAt(3) == '1')
			{
				totalCP += parseInt(unitItem.credit_points);
				console.log(unitItem.code + ' is a level 100 unit');
			}
	
		}
	});

	console.log('total level 100 units CP: ' + totalCP);

	return totalCP;
}