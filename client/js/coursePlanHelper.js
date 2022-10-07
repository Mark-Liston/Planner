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
						console.log("getFullUnit for " + unitCode + " returns " + unit);
						return unit;
					}
				}
			}
		}
	}
	
	console.log(unitCode + " not found in coursePlan");
	return null;
}