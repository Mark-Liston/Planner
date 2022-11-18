let coursePlan_Original;
let coursePlan_Edited;


$(document).ready(function()
{
    $("#addUnitToPlan").submit(AddUnit);
});

function planSearch()
{
    let inputID = $("#planSearchInput").val();

    showPlan(inputID);
}

function callCoursePlan(coursePlan)
{
    // coursePlan
    displayPlan(coursePlan);
    displayTotalCredits(coursePlan);
    checkPlanRules(coursePlan);

    displayAdvancedStanding(coursePlan);

    // hide not needed buttons
    checkPerm();
    $("#cancelChangesPlan").hide();
    $("#applyChangesPlan").hide();
    $("#approvePlan").hide();
    $("#addUnitToPlan").attr("hidden", true);
	
    updateStatus();
}

// Checks permissions and displays what is available to the user.
function checkPerm()
{
    var login = CheckLogin();
    if (login?.type == "admin" || login?.type == "staff")
    {
        $(".planSearch").attr("hidden", false);
        $("#addUnitToPlan").attr("hidden", false);
        $("#editPlan").attr("hidden", false);
    }
    else
    {
        $(".planSearch").attr("hidden", true);
        $("#addUnitToPlan").attr("hidden", true);
        $("#editPlan").attr("hidden", true);
    }
    if (login?.type == "admin")
        $("#landingStaffSignupBtn").attr("hidden", false);
    else
        $("#landingStaffSignupBtn").attr("hidden", true);
}

function updateStatus()
{
    if (coursePlan_Original?.draft_status.toUpperCase() == "DRAFT")
    {
        $("#planStatus").html("THIS PLAN IS A DRAFT AND MAY NOT SUIT YOUR INDIVIDUAL<br/>CIRCUMSTANCES. CONTACT A STAFF MEMBER FOR APPROVAL.");
        alert("The generated plan is a draft and may not be optimised to the student's individual circumstances. Before it can be finalised it must be approved by a staff member.");
    }
    if (coursePlan_Original?.draft_status.toUpperCase() == "APPROVED" ||
    	coursePlan_Edited?.draft_status.toUpperCase() == "APPROVED")
    {
	$("#planStatus").html("THIS PLAN HAS BEEN APPROVED BY A STAFF MEMBER.");
	$("#planStatus").css("background", "lime");
	$("#planStatus").css("color", "green");
    }
}

function approvePlan()
{
    coursePlan_Edited.draft_status = "approved";    
    updateStatus();
}

function displayAdvancedStanding(coursePlan)
{
    $("#ASCreditPoints").children(".body").val("");
    $("#ASCompletedUnits").children(".body").val("");

    let creditPoints = "Year 1: " + coursePlan.advanced_standing.year1CP +
		        "CP, Year 2: " + coursePlan.advanced_standing.year2CP +
		        "CP, Year 3: " + coursePlan.advanced_standing.year3CP + "CP";
    $("#ASCreditPoints").children(".body").append(creditPoints);

    let completedUnits = "";
    let units = coursePlan.completed_units;
    for (let i = 0; i < units.length; ++i)
    {
	let grade = units[i].grade;
	if (grade != "AS")
	    grade += "%";
        if (i != 0)
	    completedUnits += ", ";
	completedUnits += "<b>" + units[i].code + "</b> - " +
	                units[i].name +
	                ": <span style='color: red;'>" + grade + "</span>";
    }
    if (completedUnits == "")
        completedUnits = "None"
    $("#ASCompletedUnits").children(".body").append(completedUnits);
}

function AddUnit(e)
{
    e.preventDefault();
    $.ajax(
    {
        type: "POST",
        url: "/getUnit",
        dataType: "text",
        data: JSON.stringify({"code": $("#unitCodeInput").val()}),
        success: function(unitResponse)
        {
            let code = JSON.parse(unitResponse).code;
            let data = {
                "unit": code,
                "course_plan": coursePlan_Edited
            };
            //$.ajax(
            //{
            //    type: "POST",
            //    url: "/addUnit",
            //    dataType: "text",
            //    data: JSON.stringify(data),
            //    success: function(response)
            //    {
            //        coursePlan_Edited = JSON.parse(response);
            //        callCoursePlan(coursePlan_Edited);
            //    },
            //    error: function(response)
            //    {
            //        alert(response.responseText);
            //    }
            //});
        },
        error: function(response)
        {
            alert(response.responseText);
        }
    });
}

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
                let data = {"type": entry, "data": inputField.val()};
                $.ajax(
                {
                    type: "POST",
                    url: "/complete",
                    dataType: "text",
                    data: JSON.stringify(data),
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

function SubmitCourse()
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
            coursePlan_Original = JSON.parse(response);
            if (coursePlan_Original["message"])
            {
                alert(coursePlan_Original.message);
            }
            else
            {
                $(".page").hide();
                $("#completedUnits").show();

                $("#addDoneUnitBtn").on("click", getGrades);

                $("#submitDoneUnits").on("click", function()
                {
                    event.preventDefault();

                    let doneUnits = [];
		            let validInput = true;
                    // Puts all input grade data into JSON arr.
                    $(".unitGradeInput").each(function(i, obj)
                    {
                        // Extracts unit code from obj's id.
                        let code = $(obj).attr("id").split("_")[0];
                        let grade = "AS";
                        let numGrade = Number($(obj).val());
                        if (!isNaN($(obj).val()) && $(obj).val() != "" && numGrade >= 0 && numGrade <= 100)
                            grade = numGrade;
                        else if ($(obj).val() != "")
                            validInput = false;
                        doneUnits.push({"code": code, "grade": grade});
                    });
                    if (!validInput)
                    {
                        alert("Grade input must be 0-100 or blank");
                    }
                    else
                    {
                        if (isNaN($("#year1CPInput").val()) ||
                            isNaN($("#year2CPInput").val()) ||
                            isNaN($("#year3CPInput").val()))
                        {
                            alert("Advanced standing input must be of type integer");
                        }
                        else
                        {
                            let data = {"email": $("#studentEmailInput").val(),
                                "CP_input":
                                {
                                    year1: $("#year1CPInput").val(),
                                    year2: $("#year2CPInput").val(),
                                    year3: $("#year3CPInput").val()
                                },
                                "done_units": doneUnits,
                                "course_plan": coursePlan_Original
                            };
                            $.ajax(
                            {
                                type: "POST",
                                url: "/removeDoneUnits",
                                dataType: "text",
                                data: JSON.stringify(data),
                                success: function(response)
                                {
                                    coursePlan_Original = JSON.parse(response);

                                     //testing for level 100 units 30 pts rule
                                    /*let testtest = ["ICT102","ICT103","ICT104","ICT105","ICT106","ICT107","ICT108","ICT109","ICT111","ICT112"];
                                    for(let i = 0; i < 4; i++)
                                    {
                                        let copyUnitObj = new Object();
                                        copyUnitObj = JSON.parse(JSON.stringify(coursePlan_Original.schedule[0].semesters[0].units[0]));
                                        copyUnitObj.code = testtest[i];
                                        copyUnitObj.title = "TEST TEST";
                                        coursePlan_Original.schedule[0].semesters[0].units.push(copyUnitObj);
                                        coursePlan_Original.planned_units.push(copyUnitObj);
                                    }
                                   for(let i = 5; i < 9; i++)
                                    {
                                        let copyUnitObj = new Object();
                                        copyUnitObj = JSON.parse(JSON.stringify(coursePlan_Original.schedule[0].semesters[0].units[0]));
                                        copyUnitObj.code = testtest[i];
                                        copyUnitObj.title = "TEST TEST";
                                        coursePlan_Original.completed_units.push(copyUnitObj);
                                    }*/

                                    callCoursePlan(coursePlan_Original);
                                },
                                error: function(response)
                                {
                                    alert(response.responseText);
                                }
                            });
                        }
                    }
                });
            }
        },
        error: function(response)
        {
            alert(response.responseText);
        }
    });
    
}

function showPlanWrapper()
{
    studentIDFromEmail(CheckLogin().email, id => showPlan(id));
}

function showPlan(username)
{
    if(username != null)
    {
        $.ajax(
        {
            type: "POST",
            url: "/viewPlan",
            dataType: "text",
            cache: false,
            contentType: false,
            processData: false,
            data: '{"username": "' + username + '"}',
            success: function(response)
            {
                let savedPlan = JSON.parse(response);
                coursePlan_Original = JSON.parse(savedPlan.data);
                callCoursePlan(coursePlan_Original);
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

function getGrades()
{
    let code = extractCode($("#doneUnitInput").val());
    if (!$("#" + code.toUpperCase() + "_grade").length)
    {
        $.ajax(
        {
            type: "POST",
            url: "/getUnit",
            dataType: "text",
            data: JSON.stringify({"code": code}),
            success: function(response)
            {
                response = JSON.parse(response);
                let unitElement = "<label for='" + response.code + "_grade'>Grade for " + response.code + ":&nbsp;</label>" +
                    "<input type='text' id='" + response.code + "_grade' class='unitGradeInput' placeholder='e.g. 67'><br/>";
                $("#doneUnits").append(unitElement);
            },
            error: function(response)
            {
                alert(response.responseText);
            }
        });
    }
    else
    {
        alert("That unit has already been entered");
    }
}

function BtnSavePlan(){

	if(coursePlan_Edited.message.length > 0){
		if(confirm('This plan has errors, are you sure you want to save it?')){
			SavePlan();
		}
	} else{
		SavePlan();
	}
}

function SavePlan(){
	let login = CheckLogin();
	if(login != null){
		//Get user to describe changes
		let chg = prompt("Please describe your changes");

		if (chg != null)
                {
		    let data = {
		    	email: login.email,
		    	changes: changes = chg,
		    	plan: coursePlan_Edited
		    };

		    $.ajax(
		    {
		    	type: "POST",
		    	url: "/savePlan",
		    	dataType: "text",
		    	cache: false,
		    	contentType: false,
		    	processData: false,
		    	data: JSON.stringify(data),
		    	success: function(response)
		    	{
		    		alert("Your plan has been saved!");
		    		coursePlan_Original = coursePlan_Edited;
		    		// buttons
		    		$("#editPlan").show();
		    		$('.cp-dragButton').hide();
		    		$("#cancelChangesPlan").hide();
		    		$("#applyChangesPlan").hide();
				    $("#approvePlan").hide();
                    $("#addUnitToPlan").attr("hidden", true);
		    
		    		// revert plan to original form here
		    		callCoursePlan(coursePlan_Original);
		    	},
		    	error: function(response)
		    	{
		    		alert(response.responseText);
		    	}
		    });
		}
	} else{
		alert("Please be logged in to save a plan");
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
                "<th id='cp-ylabel'>" + year + "<div id='" + year + "Cred'>Credits:</div></th>" +
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
            code = "(Elective)";
            for (let option of units[unitCount].units)
                code += "&nbsp;&nbsp;&nbsp;" + option.code;
            title = "Undecided";
        }

        // make draggable unit
        html += "<div class='cp-unit'" + "id='" + code + "'" + ">" +
                    "<a class='cp-dragButton' style='display: none;'><img src='../images/drag icon.png' id='dragicon'></a>" +
                    "<div class='cp-info'>" +
                        "<div class='cp-header'>";
                    // If unit is elective, header will scroll, displaying all elective options.
                    if (units[unitCount].type == "undecided")
                        html += "<marquee direction='left' style='max-width: 230px;'><h1>" + code + "</h1></marquee>";
                    else
                        html += "<h1>" + code + "</h1>";
                    html += "<div class='cp-credits'>" +
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

    // assign an array to courseplan's message to be used for rules messaging
    let messages = [];
    coursePlan.message = messages;

    // enable draggable
    let col_id = document.getElementById("year" + year + "sem" + semNum);
    Sortable.create(col_id,
    {
        group: 'shared',
        handle: '.cp-dragButton',
        animation: 150,

        // drag end event
        onEnd: function (event) 
        {
            updatePlan(coursePlan_Edited, event);
            checkPlanRules(coursePlan_Edited);
            displayYearSemCredits(coursePlan_Edited);
        } // end of onEnd()
        
    });
    
    displayYearSemCredits(coursePlan);
}

function checkPlanRules(coursePlan)
{
	//Reset Warnings
	$("#messages").html('');

    let totalCP = unit100_30ptsRule(coursePlan);

    // loop for all the units inside the course plan
    coursePlan.schedule.forEach(function(yearItem)
    {
        yearItem.semesters.forEach(function(semesterItem)
        {
            semesterItem.units.forEach(function(unitItem)
            {
                console.log("CHECK PLAN RULES UNIT ITEM" + unitItem);
                // used to store rules message for a unit
                let msgObj = {
                    code: unitItem.code,
                    msg: ""
                };
                let message = '';

                // ====== Semester Availability Rule ====//
                let itemDOM = document.getElementById(unitItem.code);				
                if (!checkSemAvailability(coursePlan, unitItem, semesterItem))
                {
                    message += '<div class="message"><h3>' + unitItem.code + '</h3>';
                    // grab the courseplan column id where the item is sitting on
                    let parentOf_itemDOM_ID = itemDOM.parentNode.id;
                    message += '<p> is not available for Year ' + parentOf_itemDOM_ID.substring(4, 8) + ' Semester ' + parentOf_itemDOM_ID.substring(11);
                    message += '.<br>It is only available during <h4>Semester ' + unitItem.semester.substring(1) + '</h4>.</p>';    
                    message += '</div>';
                }
                if(!twelvePointsCompCheck(coursePlan, unitItem, semesterItem, yearItem))
                {
                    message += '<div class="message"><h3>' + unitItem.code + '</h3>';
                    // grab the courseplan column id where the item is sitting on
                    let parentOf_itemDOM_ID = itemDOM.parentNode.id;
                    message += '<p>does not meet credit point requirements</p>';
                    message += '<h5>Units higher than level 100 need at least<br> 12 completed credit points</h5><br><p>before they can be studied.</p>';    
					message += '</div>';
                }

                // ====== Pre Requisite Rule ====//
                let preReqs;
                if (!checkPrereqsMet(coursePlan, unitItem, semesterItem, yearItem, preReqs))
                {
                    message += '<div class="message"><h3>' + unitItem.code + '</h3>';
                    message += "<p> needs prerequisite unit(s): <br>";
                    // grab prereq units and put it into the message
                    unitItem.prerequisites.forEach(function(operatorItem)
                    {
                        operatorItem.items.forEach(function(preReqItem)
                        
                        {
                            if (hasUnitCode(preReqItem))
                            {
                                message += '<h4>' + preReqItem.code + '</h4>';
                                // dont add the operator if last element
                                if (operatorItem.items[operatorItem.items.length-1].code !== preReqItem.code) 
                                {
                                    message += ' <h5>' + operatorItem.operator + '</h5> ';
                                }
                            }
                            else
                            {
                                preReqItem.items.forEach(function(extraItem)
                                {
                                    message += '<h4>' + extraItem.code + '</h4>';
                                    // dont add the operator if last element
                                    if (preReqItem.items[preReqItem.items.length-1].code !== extraItem.code) 
                                    {                                                                         
                                        message += ' <h5>' + preReqItem.operator + '</h5> ';
                                    }
                                    else
                                    {
                                        if (operatorItem.items.length > 1)
                                        {
                                            message += ' <h5>' + operatorItem.operator + '</h5> ';
                                        }
                                        
                                    }
                                });
                            }
                        });
                    });
                    message += '</div>';
                }
                
                // ====== Level 100 30 points Rule ====//   
                if (unitItem.type.toUpperCase() == "DECIDED")
                {
                    if (totalCP > 30 && unitItem.code.charAt(3) == '1')
                    {
                        message += '<div class="message"><h3>' + unitItem.code + '</h3>';
                        message += '<p>exceeds 30 credit points for level 100 units.</p>';
                        message += '<p>Please exchange this with a higher level.</p>';
                        message += '</div>';
    
                    } 
                }
     
                // there's a message (invalid unit)
                if (message != '')
                {
                    //add red border on its draggable item
                    $("#" + unitItem.code).css({"border-style": "solid", "border-width": "4px", "border-color": "red"});
                    if (updateMsg(coursePlan, unitItem, message))
                    {
                        console.log("Rule message UPDATED for " + unitItem.code);
                    }
                    else
                    {
                        newMsg(coursePlan, unitItem, message, msgObj);
                        console.log("Rule message CREATED for " + unitItem.code);
                    }
                    
                }
                // no messages are created (valid unit)
                else
                {
                    // delete if message exists for that unit
                    let index = coursePlan.message.findIndex((msgItem => msgItem.code == unitItem.code));
                    if (index >= 0)
                    {               
                        coursePlan.message.splice(index, 1);
                    }
                    // remove red border
                    $("#" + unitItem.code).css({"border-style": "", "border-width": "", "border-color": ""});
                }
            });                                        
        });                   
    });
 
	let overloadedSems = studyOverloadCheck(coursePlan);
	overloadedSems.forEach(sem => {
		let message = "";
		message += '<div class="message"><h3>Overload Warning</h3>';
        message += `<h4>Year ${parseInt(coursePlan.startYear, 10) + sem.year}, Semester ${sem.sem+1}</h4>`;
        message += 'is overloaded, please ensure you have spoken to your course coordinator</p>';    
		message += '</div>';
		$("#messages").append(message);
	});

    
    // check if messages exists. if they do. show the message box.
    if (coursePlan.message.length > 0)
    {
        $("#messagesContainer").show();
        coursePlan.message.forEach(function(messageItem)
        {
            $("#messages").append(messageItem.msg);
        });
    }
    else //  if not. hide the message box
    {
        $("#messagesContainer").hide();
    }
    console.log(coursePlan);
}

function newMsg(coursePlan, unitItem, message, msgObj)
{
    msgObj.unit = unitItem.code;
    msgObj.msg = message;
    coursePlan.message.push(msgObj);

}

function updateMsg(coursePlan, unitItem, message)
{
    let index = coursePlan.message.findIndex((msgItem => msgItem.code == unitItem.code));
    if (index >= 0)
    {
        coursePlan.message[index].msg = message;
        return true;
    }
    else
    {
        return false;
    }
}

//Checks if the dragged unit is available in the semester it was moved to.
//Returns true, false, or null.
function checkSemAvailability(coursePlan, unitItem, semesterItem)
{
	// grab unit info
    let unit_code = unitItem.code;
	let unit_type = unitItem.type;

    // grab the semester of the current unitItem
	let plannedSem = semesterItem.semester;

    // undecided units are automatically available
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
	
	//console.log("checkSemAvailability for "+ unit_code + " in sem " + plannedSem + " returns: " + available);
	return available;
}

//Checks if the prerequisites for the dragged item are satisfied in its new location
function checkPrereqsMet(coursePlan, unitItem, semesterItem, yearItem)
{
    // grab unit info
    let unit_code = unitItem.code;
    let unit_type = unitItem.type;

    if(unit_type.toUpperCase() != "UNDECIDED")
	{

        //Get the year and semester the item has been dragged to
        let toYear = yearItem.year;
        let toSem = semesterItem.semester;;

        //Get the unit's prerequisites
        let preReqs = getFullUnit(unit_code, coursePlan).prerequisites;

        //prereqs is an array of prereqNode, which in turn contains
        //other prereqNodes and units.
        //Assumption: relationship between top-level prereqNodes in array is
        //"OR", i.e. only one top-level prereqNode need be satisfied.
        if(preReqs.length > 0)
        {
            for(let prereq in preReqs)
            {
                if(prereqItemMet(preReqs[prereq], toYear, toSem, coursePlan))
                {
                    //console.log("checkPrereqsMet for" + unit_code + " returns true");
                    return true;
                }
            }
            //console.log("checkPrereqsMet for " + unit_code + " returns false");
            return false;
        }
        //console.log("checkPrereqsMet: " + unit_code + " has no prereqs; checkPrereqsMet returns true");
        return true;
        
	}
   // console.log("checkPrereqsMet: undecided elective has no prereqs");
    return true;
}

function twelvePointsCompCheck(coursePlan, unitItem, semesterItem, yearItem)
{
    console.log("unit item is: " + unitItem.code);
    if(unitItem.type.toUpperCase() != "UNDECIDED")
    {
        if(parseInt(unitItem.code.charAt(3)) > 1)
        {
            return creditReqMetByYearSem(coursePlan, yearItem.year, semesterItem.semester, 12);
        }
    }
    
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

    // Make draft of updated JSON
    console.log("course plan is succesfully updated!");
    console.log(coursePlan.schedule);
}

function displayPlan(coursePlan)
{
    $(".page").hide();
	$("#results").show();

    // reset html of courseplan
    $("#courseplan").html('');
	$("#messagesContainer").hide();
    $("#messages").html('');
    $("#totalcreditspoints").html('');

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


    // make copy of courseplan for draft
    coursePlan_Edited = JSON.parse(JSON.stringify(coursePlan_Original));
    console.log(coursePlan_Edited);



}

function displayYearSemCredits(coursePlan)
{
    for(let schedYear of coursePlan.schedule)
    {
        let yearCred = 0;

        for(let schedSem of schedYear.semesters)
        {
            let col_id = "year" + schedYear.year + "sem" + schedSem.semester;
            let unitsHTML = $("#" + col_id).children();
            $("#" + col_id).text("Semester credits: " + schedSem.credit_points).append(unitsHTML);
            
            yearCred += schedSem.credit_points;
        }

        $("#" + schedYear.year + "Cred").html("Credits: " + yearCred);
    }

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


