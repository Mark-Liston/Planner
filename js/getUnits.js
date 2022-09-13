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

            // let data =
            // "<table>" +
            //     "<tr>" +
            //         "<th>Degree</th>" +
            //     "</tr>" +

            //     "<tr>" +
            //         "<th>Spine</th>" +
            //         "<th>Course Core</th>" +
            //     "</tr>";

            

            // data += "</table>" +
            // "<br/>" +
            // "<table>" +
            //     "<tr>" +
            //         "<th>Major</th>" +
            //     "</tr>" +
            // "</table>";

            // $("#display").html(data);
            // $("#display table, th, td").css("border", "1px solid");
            // $("#display").show();
            console.log(response);
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
