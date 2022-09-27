var minors = 1;

$(document).ready(function(){
	//Hide all non immediate articles
	$(".page").hide();
	$("#landing").show();
});

function MakeNewPlan(){
	$(".page").hide();
	$("#search").show();
}

//Functionality for dynamically adding and removing additional majors
function AddStudy(){
	$.get("../templates/StudyDetailsEntry.html", function(data){
		$("#ExtraStudy").append(data);
	});
	minors++;

	if(minors > 1){
		$("#AddStudyBtn").hide();
	}
}

function RemoveStudy(item){
	$(item).parent().remove();
	minors--;
	if(minors < 2){
		$("#AddStudyBtn").show();
	}
}