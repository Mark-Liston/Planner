function submitCourse()
{
    let formData = new FormData($("#StudyDetails")[0]);
    $.ajax(
    {
        type: "POST",
        url: "/submit",
        dataType: "html",
        cache: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function(response)
        {
            let coursePlan = JSON.parse(response);
            let cont = true;
            if (coursePlan["message"])
            {
                if (confirm(coursePlan.message + "\n" +
                    "Would you like to generate a course plan anyway?") == false)
                {
                    cont = false;
                }
            }

            if (cont)
            {
                displayPlan(coursePlan);
            }
        },
        error: function(response)
        {
            alert(response.responseText);
        }
    });
}


function makeRow(year, yearCount)
{
    let html = "";

    // make x-axis label placeholder
    if (yearCount == 0)
    {
        html += "<tr id='header'></tr>";
    }

    // make row
    html += "<tr id='" + year + "_row'>" + 
                // make y-axis label
                "<th id='cp-ylabel'>" + year + "</th>" +
            "</tr>";

    $("#courseplan").append(html);
}


function makeCol(year, yearCount, semCount)
{

    let html = "";

    // fill x-axis label
    if (yearCount == 0)
    {
        $("#header").append("<th id='cp-xlabel'>Semester " + (semCount+1) + "</th>"); 
    }

    // make column
    html += "<td id='year" + year + "sem" + (semCount+1) + "'></td>";

    $("#" + year + "_row").append(html);

    
}

function makeUnit(semInfo, i, year)
{


    let html = "";

    // check semester
    let semNum = semInfo.semester;
    //console.log(semNum + " = " + (i+1))

    // get unit info
    let units = semInfo.units;
    for (let unitCount = 0; unitCount < units.length; unitCount++) 
    {
        let code = units[unitCount].code;
        let credit_points = units[unitCount].credit_points;
        let title = units[unitCount].title;

        if (units.type == "undecided")
        {
            code = "Undecided (Elective)";
            title = "";
        }

        // make draggable unit
        html += "<div class='cp-unit'>" +
                    "<a class='cp-dragButton'><img src='../images/drag icon.png' id='dragicon'></a>" +
                    "<div class='cp-info'>" +
                        "<div class='cp-header'>" +
                            "<h1>" + code + "</h1>" +
                            "<div class='cp-credits'>" +
                                "<h1>" + credit_points + " CP</h1>" +
                            "</div>" +
                        "</div>" +
                        "<div class='cp-subheader'>" +
                            "<p>" + title + "</p>" +
                        "</div>" +
                    "</div>" +
                "</div>";
    }

    $("#year" + year + "sem" + semNum).append(html);

    // enable draggable
    let col_id = document.getElementById("year" + year + "sem" + semNum);
    Sortable.create(col_id,
    {
        group: 'shared',
        handle: '.cp-dragButton',
        animation: 150
    });
    

}


function displayPlan(plan)
{
    $(".page").hide();
	$("#results").show();

    // debug
    //console.log(plan);

    // grab the schedule of the plan
    let schedule = plan.schedule;

    // make course plan
    for (let yearCount = 0; yearCount < schedule.length; yearCount++)
    {
        // row
        let year = schedule[yearCount].year;
        makeRow(year, yearCount);
 

        // column
        let semTotal = 2;
        for (let semCount = 0; semCount < semTotal; semCount++)
        {
            makeCol(year, yearCount, semCount);

        }

        // unit
        let semesters = schedule[yearCount].semesters
        // determine how many sem
        for (let i = 0; i < semesters.length; i++)
        {
            let semInfo = schedule[yearCount].semesters[i]
            makeUnit(semInfo, i, year);
        }
 
    }

}
