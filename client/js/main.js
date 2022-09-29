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

	//Check if login cookie persists
	var login = CheckLogin()
	if(login != null){
		$("#username").html(login.username);
		$("#loginButton").replaceWith('<a href="#" onclick="LogOut()" class="dropdown-item">Logout</a>');
	}


});

function MakeNewPlan()
{
	$(".page").hide();
	$("#search").show();
}

// Functionality for dynamically adding and removing additional majors.
function AddStudy()
{
	$.get("../templates/StudyDetailsEntry.html", function(data)
    {
		$("#ExtraStudy").append(data);
	});
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

