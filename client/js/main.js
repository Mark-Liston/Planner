let minors = 1;

$(document).ready(function()
{
	// Hides all non immediate articles.
	$(".page").hide();
	$("#landing").show();
    $("#viewPlanBtn").hide();

    //$("#unitCodeInput").on("input", function()
    //{
    //    if ($("#unitCodeInput").val() != "")
    //    {
    //        autoComplete("Unit", $("#unitCodeInput"));
    //    }
    //});
    $("#degreeInput").on("input", function()
    {
        if ($("#degreeInput").val() != "")
        {
            autoComplete(["Degree"], $("#degreeInput"));
        }
    });
    $("#majorInput").on("input", function()
    {
        if ($("#majorInput").val() != "")
        {
            autoComplete(["Major"], $("#majorInput"));
        }
    });
    $(document).on("input", ".ExtraMajor", function()
    {
        if ($(this).val() != "")
        {
            autoComplete(["Major", "Minor", "\'Co-Major\'"], $(this));
        }
    });
    $("#doneUnitInput").on("input", function()
    {
        if ($(this).val() != "")
        {
            autoComplete(["Unit"], $(this));
        }
    });
    // Checks login every second.
    setTimeout(function()
    {
        $("#studentEmailInput").prop("readonly", false);

        //Check if login cookie persists
        var login = CheckLogin();
        if(login != null)
        {
            $("#username").html(login.username);
	    $("#signupButton").hide();
            $("#loginButton").replaceWith('<a href="#" onclick="LogOut()" class="dropdown-item">Logout</a>');
            $("#studentEmailInput").val(login.email);
            $("#viewPlanBtn").show();
	    $("#landingSignupBtn").hide();
            $("#landingLoginBtn").hide();
        }
        else
        {
            $("#viewPlanBtn").hide();
            $("#landingSignupBtn").show();
            $("#landingLoginBtn").show();	
	    $("#signupButton").hide();
        }

	if (login?.type == "admin")
	{
            $("#landingStaffSignupBtn").attr("hidden", false);
	}
	else
	{
            $("#landingStaffSignupBtn").attr("hidden", true);
	}
    }, 1000);
});

function SubmitCourseBtn(){
	if (duplicateOptions())
	{
		SubmitCourse();
	}
	else
	{
		alert("All majors/minors/co-majors must be unique");
	}
}

function validateInputField(inputField)
{
    let valid = true;
    if (!/^([^@$%&\\\/:*?"'<>|~`#^+={}\[\];!]+)$/.test(inputField.val()))
    {
        valid = false;
    }
    return valid;
}

function extractCode(text)
{
    return text.trim().split(" ")[0];
}

function duplicateOptions()
{
    let options = [];
    $(".optionInput").each(function(index)
    {
        if ($(this).val() != "")
        {
            options.push(extractCode($(this).val()).toUpperCase());
        }
    });

    return new Set(options).size == options.length;
}

function MakeNewPlan()
{
	$(".page").hide();
	$("#search").show();
}

// Functionality for dynamically adding and removing additional majors.
function AddStudy()
{
    let option = "<div class='row entry'>" +
        "<div class='col-10'>" +
            "<input type='text' name='extraInput" + minors + "' class='ExtraMajor optionInput form-control' placeholder='e.g. CJ-432'>" +
        "</div>" +
        "<button type='button' class='btn btn-outline-danger col-auto' onclick='RemoveStudy(this)'>X</button>" +
    "</div>";

    $("#ExtraStudy").append(option);

	//$.get("../templates/StudyDetailsEntry.html", function(data)
    //{
	//	$("#ExtraStudy").append(data);
	//});
	minors++;

	if(minors > 1)
    {
		$("#AddStudyBtn").hide();
	}
}

function RemoveStudy(item)
{
	$(item).parent().remove();
	minors--;
	if(minors < 2)
    {
		$("#AddStudyBtn").show();
	}
}

function editPlan()
{
    $("#editPlan").hide();

    $('.cp-dragButton').show();
    $("#cancelChangesPlan").show();
    $("#applyChangesPlan").show();
}

function cancelChangesPlan()
{

    if (confirm("Would you like to cancel without applying changes?") == true) 
    {
        // buttons
        $("#editPlan").show();
        $('.cp-dragButton').hide();
        $("#cancelChangesPlan").hide();
        $("#applyChangesPlan").hide();

        // revert plan to original form here
        callCoursePlan(coursePlan_Original);

    } 

    // debug
    console.log("Orignal:");
    console.log(coursePlan_Original);
    console.log("Edited:");
    console.log(coursePlan_Edited);

}

function calcEarliestStartSem()
{
    let startYearInput = document.getElementById("startYear");
    startYearInput.value = new Date().getFullYear();

    let sem1RadButton = document.getElementById("semester1");
    sem1RadButton.checked = true;

    let sem2RadButton = document.getElementById("semester2");

    // The last day that a student may enrol for semester 1. This is typically the
    // 11 of March.
    const lastDayToEnrolS1 = new Date(new Date().getFullYear() + "-03-11");
    // The last day that a student may enrol for semester 2. This is typically the
    // 12 of August.
    const lastDayToEnrolS2 = new Date(new Date().getFullYear() + "-08-12");

    let today = new Date();

    //If today is too late to enrol for semester 2, skip to next year.
    if (today > lastDayToEnrolS2)
    {
        startYearInput.value++;
    }
    // If today is too late to enrol for semester 1, skip to semester 2 for
    // the first year.
    else if (today > lastDayToEnrolS1)
    {
        sem2RadButton.checked = true;
    }
}
