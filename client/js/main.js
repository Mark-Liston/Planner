let minors = 1;

$(document).ready(function()
{
	// Hides all non immediate articles.
	$(".page").hide();
	$("#landing").show();
    $("#viewPlanBtn").hide();

    $("#submitCourse").on("click", function()
    {
        event.preventDefault();
        
        if (duplicateOptions())
        {
            submitCourse();
        }
        else
        {
            alert("All majors/minors/co-majors must be unique");
        }
    });

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
            autoComplete(["Major", "Minor", "Co-Major"], $(this));
        }
    });
    // Checks login every second.
    setTimeout(function()
    {
        $("#studentEmailInput").prop("readonly", false);

        //Check if login cookie persists
        var login = CheckLogin()
        if(login != null)
        {
            $("#username").html(login.username);
            $("#loginButton").replaceWith('<a href="#" onclick="LogOut()" class="dropdown-item">Logout</a>');
            $("#studentEmailInput").prop("readonly", true);
            $("#studentEmailInput").val(login.email);
            $("#viewPlanBtn").show();
            $("#landingLoginBtn").hide();
        }
        else
        {
            $("#viewPlanBtn").hide();
            $("#landingLoginBtn").show();
        }
    }, 1000);
});

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
    $("#cancelChangesPlan").hide();
    $("#applyChangesPlan").hide();
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
    $("#editPlan").show();

    $('.cp-dragButton').hide();
    $("#cancelChangesPlan").hide();
    $("#applyChangesPlan").hide();

    // revert plan to original form here
    displayPlan();
}