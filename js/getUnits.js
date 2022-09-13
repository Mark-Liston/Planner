$(document).ready(function()
{
    $("#submitCourse").on("click", function()
    {
        event.preventDefault();
        if ($("#degreeInput").val() != "" &&
            $("#majorInput").val() != "")
        {
            $("#errorMsg").hide();
            submitCourse();
        }

        else
        {
            $("#errorMsg").show();
            $("#errorMsg").text("Degree and major input is required");
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
        success: function(response)
        {
            $("#loading").hide();

            console.log(JSON.parse(response));
        },
        error: function(response)
        {
            $("display").hide();

            $("#errorMsg").text("Error: " + response.responseText);
            $("#errorMsg").show();
            $("#loading").hide();
        }
    });
}
