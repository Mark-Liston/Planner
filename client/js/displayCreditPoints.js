//var coursePlanHelper = require('./coursePlanHelper.js');

function countCredits(units)
{
    let credits = 0;
    for(let unit of units)
    {
        credits += unit.credit_points;
    }

    return credits;
}

function displayYearSemCredits(coursePlan)
{
    for(let schedYear of coursePlan.schedule)
    {
        let yearCred = 0;

        for(let schedSem of schedYear.semesters)
        {
            let credits = countCredits(schedSem.units);
            let col_id = "year" + schedYear.year + "sem" + schedSem.semester;
            let unitsHTML = $("#" + col_id).children();
            $("#" + col_id).text("Semester credits: " + credits).append(unitsHTML);
            
            yearCred += credits;
        }

        $("#" + schedYear.year + "Cred").html("Credits: " + yearCred);
    }

}

/**
 * Increases the credit point count for a particular unit level.
 * @param {*} levelsObj Object holding the credit point counts for unit levels.
 * @param {*} level Level for which to increase credit point count.
 * @param {*} creditPoints Amount of points to increase credit point count by.
 */
function addCreditsToUnitLevel(levelsObj, level, creditPoints)
{
    if(Object.hasOwn(levelsObj, level))
    {
        levelsObj[level] += creditPoints;
    }
    else
    {
        levelsObj[level] = creditPoints;
    }
}

/**
 * Gets the number of credit points for each level of completed units.
 * @param {*} levelsObj Object to store credit point counts for each level.
 * @param {*} coursePlan The course plan to retrieve credit point counts from.
 */
function getCompletedUnitCreditsByLevel(levelsObj, coursePlan)
{
    for(let unit of coursePlan.completed_units)
    {
        if(unit.grade == "AdvStnd" || (!isNaN(unit.grade) && unit.grade >= 50))
        {
            let level = unit.code[unit.code.search(/[0-9]/)] + "00";
            //let level = unit.code.charAt(3) + "00";
            console.log("level: " + level);

            addCreditsToUnitLevel(levelsObj, level, unit.credit_points);
        }
    }
}

/**
 * Gets the number of credit points for each level of planned units.
 * @param {*} levelsObj Object to store credit point counts for each level.
 * @param {*} coursePlan The course plan to retrieve credit point counts from.
 */
function getPlannedUnitCreditsByLevel(levelsObj, coursePlan)
{
    for(let unit of coursePlan.planned_units)
    {
        if(hasUnitCode(unit))
        {
            let level = unit.code[unit.code.search(/[0-9]/)] + "00";
            console.log("level: " + level);

            addCreditsToUnitLevel(levelsObj, level, unit.credit_points);
        }
    }
}

/**
 * Adds advanced standing credit points at each unit level to an object holding credit points by unit level.
 * @param {*} levelsObj The object holding credit points by unit level.
 * @param {*} coursePlan Course plan with advanced standing credit points.
 */
function getAdvStandCredByLevel(levelsObj, coursePlan)
{
    addCreditsToUnitLevel(levelsObj, 100, coursePlan.advanced_standing.year1CP);
    addCreditsToUnitLevel(levelsObj, 200, coursePlan.advanced_standing.year2CP);
    addCreditsToUnitLevel(levelsObj, 300, coursePlan.advanced_standing.year3CP);
}

/**
 * Returns the number of completed and planned credit points for each level of units.
 * @param {*} coursePlan 
 * @returns Object with properties for credit counts of each unit level in course plan.
 */
function getCreditsByLevel(coursePlan)
{
    let levels = {};

    getAdvStandCredByLevel(levels, coursePlan);
    getCompletedUnitCreditsByLevel(levels, coursePlan);
    getPlannedUnitCreditsByLevel(levels, coursePlan);

    return levels;
}

/**
 * Gets the number of completed and planned credit points for each level of units in a course plan, formatted into html table rows.
 * @param {*} coursePlan 
 * @returns HTML table rows with credit point counts for unit levels.
 */
function getCredByLvlHTML(coursePlan)
{
    let html = "";
    let levels = getCreditsByLevel(coursePlan);

    for(let level in levels)
    {
        html +=
            "<tr>" +
                "<td>Level " + level + " credits: </td>" +
                "<td>" + levels[level] + "</td>" +
            "</tr>";
    }

    return html;
}

function displayTotalCredits(coursePlan)
{
    let advStandCred = getAdvancedStandingPoints(coursePlan);
    let passedUnitCred = getPassedUnitCredPoints(coursePlan);
    let plannedUnitCred = getPlannedUnitCredPoints(coursePlan);    
    let totalPlanned = advStandCred + passedUnitCred + plannedUnitCred;
    let credLeft = coursePlan_Original.credit_points - totalPlanned;

    let htmlStr = "Credit Points Tally<br>" +
    "<table>" +
        "<thead>" +
            "<tr>" +
                "<th scope='col' style='text-align: right;'>Source</th>" +
                "<th scope='col' style='text-align: left;'>&emsp;CP</th>"+
            "</tr>" +
        "</thead>" +
        "<tr>" +
            "<td>Advanced Standing:</td>" +
            "<td>" + advStandCred + "</td>" +
        "</tr>" +
        "<tr>" +
            "<td>Passed units:</td>" +
            "<td>" + passedUnitCred + "</td>" +
        "</tr>" +
        "<tr>" + 
            "<td>Planned units:</td>" +
            "<td>" + plannedUnitCred +"</td>" +
        "</tr>" +
        getCredByLvlHTML(coursePlan) +
        "<tr>" +
            "<td>Total planned and achieved credit points:</td>" +
            "<td>" + totalPlanned + "</td>" +
        "</tr>" + 
        "<tr>" +
            "<td>Remaining credit points needed to pass*:</td>" +
            "<td>" + credLeft + "</td>" +
        "</tr>" + 
        "<tfoot>" +
            "<tr>" +
                "<td>Total credit points needed for graduation:</td>" +
                "<td>" + coursePlan_Original.credit_points + "</td>" +
            "</tr>" +
        "</tfoot>" +
    "</table>" +
    "<br/>" +
    "<p style='font-weight: normal; text-align: left;'>" +
        "*You may be able to satisfy the remaining credit points with general electives." +
        " Refer to the handbook for further information: " +
        "<a href='https://handbook.murdoch.edu.au'>handbook.murdoch.edu.au</a>" +
    "</p>";

    $("#totalcreditspoints").html(htmlStr);
}

//exports.getCreditsByLevel = getCreditsByLevel;