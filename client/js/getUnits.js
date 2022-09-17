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
            let coursePlan = JSON.parse(response);
            console.log(coursePlan);
            let cont = true;
            if (coursePlan["message"])
            {
                if (confirm(coursePlan.message + "\n" +
                    "Would you like to generate a course plan anyway?") == false)
                {
                    cont = false;
                }
            }

            if (cont)
            {
                console.log("continue");
            }
        },
        error: function(response)
        {
            // $("#errorMsg").text("Error: " + response.responseText);
            // $("#errorMsg").show();
            // $("#loading").hide();
        }
    });
}
