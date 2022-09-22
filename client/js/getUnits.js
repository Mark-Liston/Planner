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

function displayPlan(plan)
{
    $(".page").hide();
	$("#results").show();

    let schedule = plan.schedule;
    //let table = "<table>";

    let table = "<div class='container content'>" +
        "<h1>Course Planner</h1>" +
        "<h2>Here is your course plan</h2>Semester 1&emsp;&emsp;&emsp;&emsp;Semester 2" +
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

    //table += "</table>";
    $("#results").append(table);
}

