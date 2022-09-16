function submitCourse()
{
    // $("#errorMsg").hide();
    // $("#loading").show();

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
            //$("#loading").hide();

            console.log(JSON.parse(response));
        },
        error: function(response)
        {
            // $("#errorMsg").text("Error: " + response.responseText);
            // $("#errorMsg").show();
            // $("#loading").hide();
        }
    });
}
