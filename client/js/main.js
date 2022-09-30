let minors = 1;

$(document).ready(function()
{
	// Hides all non immediate articles.
	$(".page").hide();
	$("#landing").show();

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
    // Refreshes every 5 seconds in case user adds an additional major/minor
    // input field.
    setTimeout(function()
    {
        $(".ExtraMajor").each(function(index)
        {
            $(this).on("input", function()
            {
                if ($(this).val() != "")
                {
                    autoComplete(["Major", "Minor", "Co-Major"], $(this));
                }
            }); 
        });
    }, 5000);
});

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
