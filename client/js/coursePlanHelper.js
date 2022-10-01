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
				if(coursePlan.schedule[i].semesters[j].units[k].code.toUpperCase() == unitCode.toUpperCase())
				{
					console.log(coursePlan.schedule[i].semesters[j].units[k]);
					return coursePlan.schedule[i].semesters[j].units[k];
				}
			}
		}
	}
	
	console.log(unitCode + " not found in coursePlan");
	return null;
}

/**
 * Counts up the total credit points of units in a semester
 * @param semester - a coursePlan semester
 * @returns total credit points
 */
function getSemCreditPoints(semester)
{
	let creditPoints = 0;
	for(let i = 0; i < semester.units.length; i++)
	{
		creditPoints += semester.units[i];
	}
	
	return creditPoints;
}

/*
function getSemester(coursePlan, year, semester)
{
		//Find the year
		for(let i = 0; i < coursePlan.schedule.length; i++)
		{
			if(coursePlan.schedule[i].year == year)
			{
				//Find the semester
				if(semester > 0 && semester <= coursePlan.schedule[i].semesters.length)
				{
					return coursePlan.schedule[i].semesters[semester - 1];
				}
				
				break;
			}
		}
		
		return null;
}
*/
