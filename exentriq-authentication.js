var exentriqServicePath = 'http://stage.exentriq.com/JSON-RPC';
var when = require("when");
var rest = require('rest');
require('when/es6-shim/Promise');
//var Promise = require('es6-promise').Promise;

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
	   var companyName = '';

	   console.log(usernameAndCompany);
	   
	   var entity=JSON.stringify({ id: '', method: 'auth.loginBySessionToken', params: [sessionToken] });
	   rest({path:exentriqServicePath, method:"POST", entity:entity}).then(function(result) {
	       
		   var valid = false;
		   console.log(result);
	       if(result && result.entity && JSON.parse(result.entity).result){
		   var resUsername = JSON.parse(result.entity).result.username;
		   if(resUsername==username){
		       var entity2=JSON.stringify({ id: '', method: 'spaceAppPermission.hasSpacePermission', params: [username, company] });
		       rest({path:exentriqServicePath, method:"POST", entity:entity2}).then(function(result) {
			   
			   if(result && result.entity){
			       var auth = JSON.parse(JSON.parse(result.entity).result).auth;
			       if(auth){
				   var spaceName = JSON.parse(JSON.parse(result.entity).result).space;
				   companyName = spaceName;
				   valid = true;
			       }
			   }
			       
			   if (valid) {
			       var user = { username: username, permissions: "*", company:{name:companyName, id:company, group:uc.group} };
			       resolve(user);
			   } else {
			       resolve(null);
			   }
		       });
		   }
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
