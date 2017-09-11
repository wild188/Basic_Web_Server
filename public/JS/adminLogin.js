function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  var id_token = googleUser.getAuthResponse().id_token;
  console.log('id token is: ' + id_token);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/authToken');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        var res = xhr.responseText;
        console.log('response from server is: ' + res);
        //now need to get permission to go to the home page rs returns the unique token that allows you to access google data
        //In our data base we can have the email be the username and the token be the password. 
        //We need to check if the google login is an authorized user and if he/she is then we will allow them to proceed to the admin module
        //Make login info in the database
        //auth(res);
        // if success then redirect to profile page
    };
    xhr.send('idtoken=' + id_token);
}

function auth(token) {
    //if successful redirect to the homepage
    //try and cache the idToken behind the scenes
    var xhr = new XMLHttpRequest();
    var last_index = 0;
    xhr.open('POST', 'http://localhost:3333/authRedirect');
    xhr.onload = function () {
        document.open();
        document.write(xhr.responseText);
        document.close();
        window.history.pushState('page2', 'Title', '/home?id=' + token);
    };
    xhr.send(token);
}