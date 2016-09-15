var when = require("when");
var rest = require('rest');

module.exports = {
   type: "credentials",
   users: function(username) {
       return when.promise(function(resolve) {
	   
           // Do whatever work is needed to check username is a valid
           // user.
	   var valid = true;
           if (valid) {
               // Resolve with the user object. It must contain
               // properties 'username' and 'permissions'
               var user = { username: username, permissions: "*"};
               resolve(user);
           } else {
               // Resolve with null to indicate this user does not exist
               resolve(null);
           }
       });
   },
   authenticate: function(usernameAndCompany,sessionToken) {
       return when.promise(function(resolve) {
           // Do whatever work is needed to validate the username/password
           // combination.
	   
	   var uc = JSON.parse(usernameAndCompany);
	   var username = uc.username;
	   var company = uc.company;
	   
	   var entity=JSON.stringify({ id: '', method: 'auth.loginBySessionToken', params: [sessionToken] });
	   rest({path:'http://stage.exentriq.com/JSON-RPC', method:"POST", entity:entity}).then(function(result) {
	       
	       var valid = false;
	       if(result && result.entity){
		   var resUsername = JSON.parse(result.entity).result.username;
		   if(resUsername==username){
		       valid=true;
		   }
	       }
	       
	       if (valid) {
		   // Resolve with the user object. Equivalent to having
		   // called users(username);
		   var user = { username: username, permissions: "*", company:company };
		   resolve(user);
	       } else {
		   // Resolve with null to indicate the username/password pair
		   // were not valid.
		   resolve(null);
	       }
	    });
       });
   },
   default: function() {
       return when.promise(function(resolve) {
           // Resolve with the user object for the default user.
           // If no default user exists, resolve with null.
           resolve(null);
       });
   }
}
