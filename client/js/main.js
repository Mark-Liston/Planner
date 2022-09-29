let minors = 1;

$(document).ready(function()
{
	// Hides all non immediate articles.
	$(".page").hide();
	$("#landing").show();

    $("#submitCourse").on("click", function()
    {
        event.preventDefault();
        
        submitCourse();
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
            autoComplete("Degree", $("#degreeInput"));
        }
    });
    $("#majorInput").on("input", function()
    {
        if ($("#majorInput").val() != "")
        {
            autoComplete("Major", $("#majorInput"));
        }
    });
});

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
            "<input type='text' name='extraInput" + minors + "' class='ExtraMajor form-control ' placeholder='e.g. CJ-432'>" +
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
