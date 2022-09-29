//Login functionality for signing in and logging out
//Login object should contain username and email

function CheckLogin(key)
{
	//Check if cookie exists if it doesn't then
	//return null else return object

	// username=
	const prefix = key + "=";
	// retrieve cookies
	const cookiesDecoded = decodeURIComponent(document.cookie);
	// split cookies
	const cookiesArr = cookiesDecoded.split('; ');

	// find cookie
	for (let i = 0; i < cookiesArr.length; i++)
	{
		let cookie = cookiesArr[i];

		// skip spaces
		while (cookie.charAt(0) == ' ')
		{
			cookie = cookie.substring(1);
		}

		// grab specified cookie name
		if (cookie.indexOf(prefix) == 0)
		{
			return cookie.substring(prefix.length, cookie.length);
		}
	}

	//cookie not found
	return "";
}


function LogIn(){
	$.post('/server/LogIn',  //URL to send data to
		//Data being sent
		{
			email: $("#emailInput"),
			password: $("#passwordInput")
		},
		function(data, status, xhr) {   var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
					//Get response
					var response = this.responseText;

					//If response valid parse it
					console.log("Response: " + response);
					if (response !== "")
					{
						accountIn = JSON.parse(response);

						//If password valid store login in cookie / Update cookie if it exists
						if (password == accountIn.password)
						{
							// update login cookie
							account.username = accountIn.username;
							account.type = accountIn.type;
							json_str = JSON.stringify(account);
							createCookie("login", json_str, 1); //it also overwrites/updates cookie that has login as the key

							// add guest cart (if not empty) to log-in account's cart cookie
							var cookieGuest = getCookie("guest");
							if (cookieGuest) {
								createCookie(username, cookieGuest, 1);

								createCookie("guest", "", 0);
							}
							location.reload();
							return true;

						} else
						{ //if invalid tell the user off
							document.getElementById("loginAlert").innerText = "Incorrect password";
							return false;
						}
					}
					else
					{ //if invalid tell the user off
						document.getElementById("loginAlert").innerText = "No Account Found";
						return false;
					}
				}
			}

		}).fail(function(jqxhr, settings, ex) {

			console.log('failure to connect to login system')

		}
	);
}


function LogOut(){
	//Destroy login cookie and force reload of page

	createCookie("login","",0);
	location.reload();
	console.log("Logged out");

}

function createCookie(key, value, expireDays)
{
	// set expirate date
	const d = new Date();
	d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
	let expires = "expires=" + d.toUTCString();

	// make cookie
	document.cookie = key + "=" + value + ";" + expires + ";path=/";
}

function getUsername() {
	var json_str = getCookie("login");
	if (json_str) {
		var account = JSON.parse(json_str);
		return account.username;
	}

	return "";
}
