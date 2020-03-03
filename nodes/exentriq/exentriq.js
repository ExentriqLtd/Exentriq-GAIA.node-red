module.exports = function(RED) {
    "use strict";
    var http = require("follow-redirects").http;
    var https = require("follow-redirects").https;
    
    function EdoCardNode(n) {
	RED.nodes.createNode(this,n);
	
	this.space = n.space;
	this.project = n.project;
	this.name = n.name;
	this.members = n.members;
	
	var node = this;
	
	node.on("input", function(msg) {
	    if(msg.project){
		node.project = msg.payload.project;
	    }
	    if(msg.name){
		node.name = msg.payload.name;
	    }
	    if(msg.members){
		node.members = msg.payload.members;
	    }
	    	    
	    var data = { "title":node.name,  "boardId":node.project };
	    if(node.members){
		data.members = node.members.replace(/,[ ]*$/, '').split(',').map(function(member) {return {"username":member.trim()}});
	    }
	    
	    var post_data = JSON.stringify(data);
	    
	    var host = RED.settings.exentriq.boardsApiHost;
	    var post_options = {
	      "host": host,
	      "path": "/api/cards/createCard",
	      "method": "POST",
              "headers": {
	        "Content-Type": "application/json"
              }
	    };
	    
	    node.status({fill:"green",shape:"dot",text:"creating card..."});
	    var post_req = https.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
		    	node.status({});
			msg.payload = JSON.parse(chunk);
			msg.project = node.project;
			if(msg.payload.cardId){
			    msg.card = msg.payload.cardId;
			}
			node.send(msg);
		});
	    }).on('error', function (err) {
		node.status({fill:"red",shape:"dot",text:"card creation error!"});
		msg.payload = err;
		node.send(msg);
	    });
		
	    post_req.write(post_data);
	    post_req.end();
	});
    }
    
    RED.nodes.registerType("edo-card", EdoCardNode);
    
    function EdoTaskNode(n) {
	RED.nodes.createNode(this,n);
	
	this.space = n.space;
	this.project = n.project;
	this.name = n.name;
	this.card = n.card;
	this.members = n.members;
	this.username = n.username;
	
	var node = this;
	
	node.on("input", function(msg) {
	    if(msg.project){
		node.project = msg.project;
	    }
	    if(msg.card){
		node.card = msg.card;
	    }
	    if(msg.name){
		node.name = msg.name;
	    }
	    if(msg.members){
		node.members = msg.members;
	    }
	    	    
	    var data = { "taskTitle":node.name,  "boardId":node.project, "cardId":node.card, "username": node.username };
	    if(node.members){
		data.members = node.members.replace(/,[ ]*$/, '').split(',').map(function(member) {return {"username":member.trim()}});
	    }
	    var post_data = JSON.stringify(data);
	    
	    var host = RED.settings.exentriq.boardsApiHost;
	    
	    var post_options = {
	      "host": host,
	      "path": "/api/task/create",
	      "method": "POST",
              "headers": {
	        "Content-Type": "application/json"
              }
	    };
	    
	    node.status({fill:"green",shape:"dot",text:"creating task..."});
	    var post_req = https.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
		        node.status({});
			msg.payload = chunk;
			node.send(msg);
		});
	    }).on('error', function (err) {
		node.status({fill:"red",shape:"dot",text:"task creation error!"});
		msg.payload = err;
		node.send(msg);
	    });
		
	    post_req.write(post_data);
	    post_req.end();
	});
    }
    
    RED.nodes.registerType("edo-task", EdoTaskNode);
    
    function ExentriqEventNode(config) {
        RED.nodes.createNode(this,config);

        var node = this;
		this.rules = config.rules || [];

        var kafka = require('kafka-node');
        var HighLevelConsumer = kafka.HighLevelConsumer;
        var Client = kafka.Client;
        var topics = "NewObjectEvent";
        var clusterZookeeper = RED.settings.exentriq.clusterZookeeper;
        var groupId = config.group;
        var type = config.event;
        var space = config.owner.split("-")[0]; //this avoid the multiple flow problem ì, i.e: space 3-14
        var client; 
        var consumer;
		
		var that = this;
		
        topics = [{topic:topics}];      

        var options = {
            groupId: groupId,
            autoCommit: true,
            autoCommitMsgCount: 10
        };
        
        var createConsumer = function(retry, node, client){
          try {
              client = new Client(clusterZookeeper);
              consumer = new HighLevelConsumer(client, topics, options);
              node.log("Consumer created on space " + space + ", topic " + topics + " " + clusterZookeeper);
              node.status({fill:"green",shape:"dot",text:"connected to "+clusterZookeeper});
			  var eventType = null;
			  var activityType = null
			  var msg = null;
              consumer.on('message', function (message) {
        	  try {
        	      //node.log("Consumer msg: " + JSON.stringify(message));
        	      var event = JSON.parse(message.value);
        	      //node.log("Consumer event: " + event.type + " node.rules " + node.rules.length);
        	      eventType = event.type;
        	      if(event.data && event.data.activityType){
	        	      activityType = event.data.activityType;
        	      }
        	       //node.log("Consumer activityType: " + activityType);
        	       var spaceId = event.data.spaceId;
        	       //some events miss spaceId and add it in a data.exentriqContext obj
        	       if(!spaceId && event.data.exentriqContext){
	        	       for(var i=0; i < event.data.exentriqContext.length; i++){
		        	       if(event.data.exentriqContext[i].type == "space"){
			        	       spaceId = event.data.exentriqContext[i].id;
		        	       }
	        	       }
	        	       
        	       }
        	       //some events miss spaceId and add it in a data.context[0] obj
        	       if(!spaceId && event.data.context && event.data.context.length > 0 && event.data.context[0].items){
	        	       for(var i=0; i < event.data.context[0].items.length; i++){
		        	       if(event.data.context[0].items[i].type == "space"){
			        	       spaceId = event.data.context[0].items[i].id;
		        	       }
	        	       }
	        	       
        	       }
        	      if(space == spaceId){//non è più legato solo a un evento && type == event.type){
	        	     msg =  {payload: event};// {payload: event.entities[0].value};
                     //node.send(msg);
                     
        	      }else{
	        	      node.send(null);
	        	      return;
        	      }
        	     
				} catch (e) {
					//msg = {payload: message}
				    node.error(message);
				}
				node.log("Consumer eventType: " + eventType);
				if(eventType != null){
				
					var onward = [];
		            try {
		                var prop = eventType;
		                var elseflag = true;
		                for (var i=0; i<node.rules.length; i+=1) {
		                    var rule = node.rules[i];
		                    var test = prop;
		                    
		                    if(rule.t == "eq"){
			                    if(test == rule.v){
				                    //if defined activityType rule, it must be equal, otherwise pass all the incoming activity types
				                    
				                    if(rule.v2 && rule.v2 === activityType){
					                    onward.push(msg);
				                    }else if(!rule.v2){
					                    onward.push(msg);
				                    }else
				                    	onward.push(null);
				                    
				                }else
				                	onward.push(null);
				                    
		                    }else if(rule.t == test)
		                    {
			                    if(rule.v2 && rule.v2 === activityType){
				                    onward.push(msg);
			                    }else if(!rule.v2){
				                    onward.push(msg);
			                    }else
			                    	onward.push(null);
		                    }else{
			                    onward.push(null);
		                    }
		                }
		                node.previousValue = prop;
		                //node.log("Send " + onward);
		                node.send(onward);
		            } catch(err) {
		                node.warn(err);
		            }
	            
	            }
				
				
                  
              });


              consumer.on('error', function (err) {
                 console.error(err);
                 node.status({fill:"red",shape:"dot",text:"NOT connected to "+clusterZookeeper});
                 consumer.close();
                 if(retry){
                   console.error("Retry to connect after 15s");
                   setTimeout(function() {console.error("Retrying...");createConsumer(false, node, client);}, 15000);
                 }
              });
          }
          catch(e){
              node.error(e);
              return;
          }
        }

        createConsumer(true, this, client);
        
        node.on('close', function() {
            consumer.close();
        });

    }
    
    RED.nodes.registerType("exentriq-event", ExentriqEventNode);
};