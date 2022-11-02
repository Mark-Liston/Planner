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
				if(unit.type.toUpperCase() == "DECIDED")
				{
					if(unit.code.toUpperCase() == unitCode.toUpperCase())
					{
						console.log("getFullUnit for " + unitCode + " returns " + unit.code);
						console.log(unit);
						return unit;
					}
				}
			}
		}
	}
	
	console.log(unitCode + " not found in coursePlan");
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
						console.log("year: " + schedule[i].year + " sem: " + schedule[i].semesters[j].semester);
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
    console.log(points);
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
		if(unit.grade == "AS" || (!isNaN(unit.grade) && unit.grade >= 50))
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