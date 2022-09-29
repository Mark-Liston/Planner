//Login functionality for signing in and logging out
//Login object should contain username and email

function CheckLogin(){
	//Check if cookie exists if it doesn't then 
	//return null else return object
}

function LogIn(){
	$.post('/server/LogIn',  //URL to send data to
    	//Data being sent
		{ 
			email: $("#emailInput"),
			password: $("#emailInput")
		}, 
        function(data, status, xhr) {   // success callback function
			//Create session cookie here and force reload!!!

        }).fail(function(jqxhr, settings, ex) {
			//Report failure

		}
	); 
}

function LogOut(){
	//Destroy login cookie and force reload of page
}