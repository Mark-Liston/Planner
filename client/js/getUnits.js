<<<<<<< HEAD
function autoComplete(inputField)
{
    $.ajax(
    {
        type: "POST",
        url: "/complete",
        dataType: "text",
        data: inputField.val(),
        success: function(response)
        {
            console.log(response);
        }
    });
}

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

function addUnit()
{

}

function displayPlan(plan)
{
    $(".page").hide();
	$("#results").show();

    let schedule = plan.schedule;
    //let table = "<table>";

    let table = "<div class='container content'>" +
        "<h1>Course Planner</h1>" +
        "<h2>Here is your course plan</h2>" +
        "<h1>Semester 1&emsp;&emsp;&emsp;&emsp;Semester 2</h1>" +
        "<div class='container subcontent'>" +
            // Generated Course Plan
            "<div class='courseplan'>";
    $("#results").append(table);

    for (let yearCount = 0; yearCount < schedule.length; ++yearCount)
    {
        let year = schedule[yearCount];
        let semesters = year.semesters;
        // Year 1 Row
        table = "<div class='row'>" +
                    year.year + "<div id='cell_y" + yearCount + "s1' class='cell' style='border-top-left-radius: 10px;'>";

        if (semesters[0] != null && semesters[0].semester == 1)
        {
            for (let unitCount = 0; unitCount < semesters[0].units.length; ++unitCount)
            {
                let unit = semesters[0].units[unitCount];

                let code = unit.code;
                let credit_points = unit.credit_points;
                let title = unit.title;
                if (unit.type == "undecided")
                {
                    code = "Undecided (Elective)";
                    title = "";
                }

                table +=    "<div class='cp-unit'>" +
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
        }

        table +=    "</div>" +
                    "<div id='cell_y" + yearCount + "s2' class='cell' style='border-left: none; border-top-right-radius: 10px;'>";

        if (semesters[0].semester == 2)
        {
            semesters[1] = semesters[0];
        }
        if (semesters[1] != null)
        {
            for (let unitCount = 0; unitCount < semesters[1].units.length; ++unitCount)
            {
                let unit = semesters[1].units[unitCount];

                let code = unit.code;
                let credit_points = unit.credit_points;
                let title = unit.title;
                if (unit.type == "undecided")
                {
                    code = "Undecided (Elective)";
                    title = "";
                }

                table +=    "<div class='cp-unit'>" +
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
        }

        $("#results").append(table);

        Sortable.create(eval("cell_y" + yearCount + "s1"),
        {
            group: 'shared',
            handle: '.cp-dragButton',
            animation: 150
        });

        Sortable.create(eval("cell_y" + yearCount + "s2"),
        {
            group: 'shared',
            handle: '.cp-dragButton',
            animation: 150
        });
    }

    table =    "</div>" +
            "</div>" +
        "</div>" +
    "</div>";

    $("#results").append(table);
}

=======
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

        if (units[unitCount].type == "undecided")
        {
            code = "Elective";
            title = "Undecided";
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
>>>>>>> main
