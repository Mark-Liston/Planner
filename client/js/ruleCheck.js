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