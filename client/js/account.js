//Login functionality for signing in and logging out
//Login object should contain username and email

function CheckLogin(key)
{
	let cookies = parseCookies();
	return cookies.login != undefined ? JSON.parse(cookies.login) : undefined;
}

function StaffSignUpWrapper()
{
    SignUp($("#staffSignupIDInput").val(), $("#staffSignupEmailInput").val(), "staff", $("#staffSignupPasswordInput").val(), false);
}

function StudentSignUpWrapper()
{
    SignUp($("#signupIDInput").val(), $("#signupEmailInput").val(), "student", $("#signupPasswordInput").val(), true)
}

function SignUp(IDInput, emailInput, typeInput, passwordInput, loginFlag)
{
    if (IDInput == "" &&
        emailInput == "" &&
        passwordInput == "")
    {
        alert("Please populate all signup input fields");
    }
    else
    {
        $.post("/register",
            {
                username: IDInput,
                email: emailInput,
                type: typeInput,
                password: passwordInput
            },
            function(data, status, xhr)
            {
		if (loginFlag == false)
		{
                    alert("Staff account created for " + emailInput);
		}
		else if (status == "success")
                {
            	    LogIn(emailInput, passwordInput);
                }
            }).fail(function(jqxhr, settings, ex)
            {
            	alert(jqxhr.responseJSON.reason);
            });
    }
}

function LogInWrapper()
{
    LogIn($("#emailInput").val(), $("#passwordInput").val());
}

function LogIn(emailInput, passwordInput)
{
    $.post('/login',  //URL to send data to
    	//Data being sent
    	{
	    email: emailInput,
	    password: passwordInput
    	},
    	function(data, status, xhr)
	{
    	    if (status == "success")
	    {
	        let account = {};
	        account.username = data.username;
	        account.email = data.email;
		account.type = data.type;
	        // TODO - implement type and cookie storing
	        json_str = JSON.stringify(account);
	        createCookie("login", json_str, 1);
	        createCookie("sessionID", data.sessionID, 1);

	        location.reload();
	    }
    	}).fail(function(jqxhr, settings, ex)
        {
	    //Check if unauthorised response
	    if (jqxhr.status == 401)
	    {
	    	// Print reason for login failure
	    	alert(jqxhr.responseJSON.reason);
	    }
	    else
	    {
	    	console.log('failure to connect to login system')
	    }
    	}
    );
}


function LogOut(){
	createCookie("login","",0);
	createCookie("sessionID","",0);
	//Destroy login cookie and force reload of page
	$.post('/logout', 
		{},
		function(data, status, xhr) {
			// Do nothing
		}).fail(function(jqxhr, settings, ex) {
			console.log('failed to logout')
		}
	);
	console.log("Logged out");
	location.reload();
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

function parseCookies() {
    const list = {};
    const cookieHeader = document.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}
