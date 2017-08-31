module.exports = function(RED) {
    "use strict";
    var http = require("follow-redirects").http;
    var https = require("follow-redirects").https;
    
    function ExentriqCardNode(n) {
	RED.nodes.createNode(this,n);
	
	this.space = n.space;
	this.project = n.project;
	this.name = n.name;
	this.destination = n.destination;
	
	var node = this;
	
	node.on("input", function(msg) {
	    if(msg.payload.space){
		node.space = msg.payload.space;
	    }
	    if(msg.payload.project){
		node.project = msg.payload.project;
	    }
	    if(msg.payload.name){
		node.name = msg.payload.name;
	    }
	    	    
	    var data = { "title":node.name,  "boardId":node.project }
	    var post_data = JSON.stringify(data);
	    
	    var host = (node.destination=='stage') ? "boards-new-stage.exentriq.com" : "boards-new.exentriq.com";
	    
	    var post_options = {
	      "host": host,
	      "path": "/api/cards/createCard",
	      "method": "POST",
              "headers": {
	        "Content-Type": "application/json"
              }
	    };
	    
	    var post_req = https.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('Response: ' + chunk);
		});
	    });
		
	    post_req.write(post_data);
	    post_req.end();
	});
    }
    
    RED.nodes.registerType("exentriq-card", ExentriqCardNode);
    
    function ExentriqTaskNode(n) {
	RED.nodes.createNode(this,n);
	
	this.space = n.space;
	this.project = n.project;
	this.name = n.name;
	this.card = n.card;
	this.destination = n.destination;
	
	var node = this;
	
	node.on("input", function(msg) {
	    if(msg.payload.space){
		node.space = msg.payload.space;
	    }
	    if(msg.payload.project){
		node.project = msg.payload.project;
	    }
	    if(msg.payload.card){
		node.card = msg.payload.card;
	    }
	    if(msg.payload.name){
		node.name = msg.payload.name;
	    }
	    	    
	    var data = { "taskTitle":node.name,  "boardId":node.project, "cardId":node.card, "username": "calogero@exentriq.com" }
	    console.log(data);
	    var post_data = JSON.stringify(data);
	    
	    var host = (node.destination=='stage') ? "boards-new-stage.exentriq.com" : "boards-new.exentriq.com";
	    
	    var post_options = {
	      "host": host,
	      "path": "/api/task/create",
	      "method": "POST",
              "headers": {
	        "Content-Type": "application/json"
              }
	    };
	    
	    var post_req = https.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('Response: ' + chunk);
		});
	    });
		
	    post_req.write(post_data);
	    post_req.end();
	});
    }
    
    RED.nodes.registerType("exentriq-task", ExentriqTaskNode);
};