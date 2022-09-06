$(document).ready(function()
{
    $("#submitCourse").on("click", function()
    {
        event.preventDefault();
        if ($("#degreeInput").val() != "" && $("#optionInput").val() != "")
        {
            $("#errorMsg").hide();
            submitCourse();
        }

        else
        {
            $("#errorMsg").show();
            $("#errorMsg").text("Input is required");
        }
    });
});

function submitCourse()
{
    $("#errorMsg").hide();
    $("#loading").show();

    var formData = new FormData($("#courseDetailsForm")[0]);
    $.ajax(
    {
        type: "POST",
        url: "/submit",
        dataType: "html",
        cache: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function(result)
        {
            $("#loading").hide();
        },
        error: function(result)
        {
            $("#errorMsg").text("A course matching those details could not be retrieved.");
            $("#errorMsg").show();
            $("#loading").hide();
        }
    });
}
