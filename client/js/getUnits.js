function autoComplete(type, inputField)
{
    if (validateInputField(inputField))
    {
        let func = [];
        let sources = [];
        // Compiles the search results from all categories specified in type,
        // e.g., if type = ["Major"] only results for major will be shown in
        // autocomplete. If type = ["Major", "Minor", "Co-Major"] then results for
        // all three categories will be shown.
        for (let entry of type)
        {
            func.push(new Promise(function(resolve, reject)
            {
                $.ajax(
                {
                    type: "POST",
                    url: "/complete",
                    // data is sent as JSON in text form and parsed server-side.
                    dataType: "text",
                    data: '{"type": "\'' + entry + '\'", "data": "' + inputField.val() + '"}',
                    success: function(response)
                    {
                        // Appends results to array of suggestions.
                        sources = sources.concat(JSON.parse(response));
                        resolve();
                    }
                });
            }));
        }
        Promise.all(func).then(function()
        {
            // Displays suggestions after all categories have been compiled.
            inputField.autocomplete({source: sources});
        });
    }
}

// an event that removes ghost image when dragging a unit
document.addEventListener("dragstart", function(event) {
    var img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(img, 0, 0);
}, false);


// todo a listener to listen when an item is dropped then update JSON


function submitCourse()
{
    if ($("#studentEmailInput").val() == "")
    {
        alert("A student email is required");
    }
    else
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
                    displayTotalCredits(coursePlan);
                }
            },
            error: function(response)
            {
                alert(response.responseText);
            }
        });
    }
}

function showPlan()
{
    var login = CheckLogin()
    if(login != null)
    {
        $.ajax(
        {
            type: "POST",
            url: "/viewPlan",
            dataType: "text",
            cache: false,
            contentType: false,
            processData: false,
            data: '{"email": "' + login.email + '"}',
            success: function(response)
            {
                let coursePlan = JSON.parse(response);
                displayPlan(JSON.parse(coursePlan.data));
                displayTotalCredits(JSON.parse(coursePlan.data));
            },
            error: function(response)
            {
                alert(response.responseText);
            }
        });
    }
    else
    {
        $("#viewPlanBtn").hide();
    }
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

function makeUnit(coursePlan, year, yearCount, semCount)
{
    let html = "";

    let semInfo = coursePlan.schedule[yearCount].semesters[semCount];

    // check semester
    let semNum = semInfo.semester;

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
                                "<h1 >" + credit_points + " CP</h1>" +
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
        animation: 150,

        // drag end event
        onEnd: function(event) 
        {
            // rules here       

			//Is only returning true/false/null. Use as you deem appropriate.
			checkSemAvailability(coursePlan, event);
            checkPrereqsMet(coursePlan, event);
			
            updatePlan(coursePlan, event);
        }

    });  
}

//Checks if the dragged unit is available in the semester it was moved to.
//Returns true, false, or null.
function checkSemAvailability(coursePlan, event)
{
	// grab unit code from the draggable item
    let unit_code = event.item.getElementsByClassName("cp-header")[0].firstChild.textContent;
	let unit_type = "DECIDED";
	if(event.item.getElementsByClassName("cp-subheader")[0].firstChild.textContent.toUpperCase() == "UNDECIDED")
	{
		unit_type = "UNDECIDED";
	};
	let plannedSem = event.to.id.substring(11)

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
	
	console.log("checkSemAvailability for "+ unit_code + " in sem " + plannedSem + " returns: " + available);
	return available;
}

//Checks if the prerequisites for the dragged item are satisfied in its new location
function checkPrereqsMet(coursePlan, event)
{
    if(event.item.getElementsByClassName("cp-subheader")[0].firstChild.textContent.toUpperCase() != "UNDECIDED")
	{
        //Get the unit code of the dragged item
		let unit_code = event.item.getElementsByClassName("cp-header")[0].firstChild.textContent;
        
        //Get the year and semester the item has been dragged to
        let toYear = event.to.id.substring(4, 8);
        let toSem = event.to.id.substring(11);

        //Get the unit's prerequisites
        let prereqs = getFullUnit(unit_code, coursePlan).prerequisites;

        //prereqs is an array of prereqNode, which in turn contains
        //other prereqNodes and units.
        //Assumption: relationship between top-level prereqNodes in array is
        //"OR", i.e. only one top-level prereqNode need be satisfied.
        if(prereqs.length > 0)
        {
            for(let prereq in prereqs)
            {
                if(prereqItemMet(prereqs[prereq], toYear, toSem, coursePlan))
                {
                    console.log("checkPrereqsMet for" + unit_code + " returns true");
                    return true;
                }
            }
            console.log("checkPrereqsMet for " + unit_code + " returns false");
            return false;
        }
        console.log("checkPrereqsMet: " + unit_code + " has no prereqs; checkPrereqsMet returns true");
        return true;
        
	}
    console.log("checkPrereqsMet: undecided elective has no prereqs");
    return true;
}

function updatePlan(coursePlan, event)
{
    // grab unit code from the draggable item
    let unit_code = event.item.getElementsByClassName("cp-header")[0].firstChild.textContent;
	let unit_type = "DECIDED";
	if(event.item.getElementsByClassName("cp-subheader")[0].firstChild.textContent.toUpperCase() == "UNDECIDED")
	{
		unit_type = "UNDECIDED";
	}
    let copyUnitObj = new Object();
    
    // grab year and semester of the table id
    let fromTable_id = event.from.id;
    let fromYear = fromTable_id.substring(4, 8);
    let fromSem = fromTable_id.substring(11);

    let toTable_id = event.to.id;
    let toYear = toTable_id.substring(4, 8);
    let toSem = toTable_id.substring(11);
	
	let copied = false;

    // debug
    console.log("dropped: " + unit_code + 
                '\n' + "from: Year " + fromYear + ", Sem " + fromSem + 
                '\n' + "to: Year " + toYear + ", Sem " + toSem);
	
    // From update
    for (let i = 0; i < coursePlan.schedule.length; i++)
    {
        // determine year
        if (fromYear == coursePlan.schedule[i].year)
        {
            // determine semester
            for (let j = 0; j < coursePlan.schedule[i].semesters.length; j++)
            {
                if (fromSem == (j+1))
                {
                    for (let k = 0; k < coursePlan.schedule[i].semesters[j].units.length && copied == false; k++)
                    {
						//If moved unit is decided, i.e. has a unit code
						if(unit_type.toUpperCase() == "DECIDED")
						{		
							// find the unit thats been dragged
							if (coursePlan.schedule[i].semesters[j].units[k].code == unit_code)
							{
								// create a copy of that object
								copyUnitObj = coursePlan.schedule[i].semesters[j].units[k];
								copied = true;
								
							}
						}
						//otherwise if find first undecided unit in semester
						else if(coursePlan.schedule[i].semesters[j].units[k].type.toUpperCase() == "UNDECIDED")
						{
							// create a copy of that object
							copyUnitObj = coursePlan.schedule[i].semesters[j].units[k];
							copied = true;
						}
						
						if(copied == true)
						{
							// remove the unit from the JSON
							coursePlan.schedule[i].semesters[j].units.splice(k, 1);
							// debug
							console.log("removed Year " + fromYear + ", Sem " + fromSem + " unit: " + unit_code); 
							console.log(coursePlan.schedule[i].semesters[j].units);

							// update the JSON credit points for that year semester
							coursePlan.schedule[i].semesters[j].credit_points -= copyUnitObj.credit_points;  
							// debug
							console.log("updated Year " + fromYear + ", Sem " + fromSem + " credits: " + coursePlan.schedule[i].semesters[j].credit_points);
						}
                    }

                }
            }
        }
    }

    // To update
	if(copied == true)
	{
		for (let i = 0; i < coursePlan.schedule.length; i++)
		{
			// determine year
			if (toYear == coursePlan.schedule[i].year)
			{
				// determine semester
				for (let j = 0; j < coursePlan.schedule[i].semesters.length; j++)
				{
					if (toSem == (j+1))
					{        
						// add the copied unit obj
						coursePlan.schedule[i].semesters[j].units.push(copyUnitObj);
						console.log("added Year " + toYear + ", Sem " + toSem + " unit: " + unit_code); 
						console.log(coursePlan.schedule[i].semesters[j].units);

						// update the JSON credit points for that year semester
						coursePlan.schedule[i].semesters[j].credit_points += copyUnitObj.credit_points;  
						// debug
						console.log("updated Year " + toYear + ", Sem " + toSem + " credits: " + coursePlan.schedule[i].semesters[j].credit_points); 
					}
				}
			}
		}
	}
	
	console.log("copied == " + copied);

    // debug - UPDATED JSON HERE
    console.log("course plan is succesfully updated!");
    console.log(coursePlan.schedule);
}


function displayPlan(coursePlan)
{
    $(".page").hide();
	$("#results").show();

    // debug
    //console.log(coursePlan);

    // make course coursePlan
    for (let i = 0; i < coursePlan.schedule.length; i++)
    {
        // makes row
        let year = coursePlan.schedule[i].year;
        makeRow(year, i);
 
        // makes column
        let semTotal = 2;
        for (let j = 0; j < semTotal; j++)
        {
            makeCol(year, i, j);

            // fills column with units
            makeUnit(coursePlan, year, i, j);

        }
 
    }

    // debug
    console.log("course plan is displayed!");
}

function displayTotalCredits(coursePlan)
{
    $("#totalcreditspoints").html("Total Credit Points: " + coursePlan.credit_points);
}
