/**
 * Copyright 2014 IBM, Antoine Aflalo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


RED.settings = (function () {

    var loadedSettings = {};

    var hasLocalStorage = function () {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };

    var set = function (key, value) {
        if (!hasLocalStorage()) {
            return;
        }
        localStorage.setItem(key, JSON.stringify(value));
    };

    /**
     * If the key is not set in the localStorage it returns <i>undefined</i>
     * Else return the JSON parsed value
     * @param key
     * @returns {*}
     */
    var get = function (key) {
        if (!hasLocalStorage()) {
            return undefined;
        }
        return JSON.parse(localStorage.getItem(key));
    };

    var remove = function (key) {
        if (!hasLocalStorage()) {
            return;
        }
        localStorage.removeItem(key);
    };

    var setProperties = function(data) {
        for (var prop in loadedSettings) {
            if (loadedSettings.hasOwnProperty(prop) && RED.settings.hasOwnProperty(prop)) {
                delete RED.settings[prop];
            }
        }
        for (prop in data) {
            if (data.hasOwnProperty(prop)) {
                RED.settings[prop] = data[prop];
            }
        }
        loadedSettings = data;
    };

    var init = function (done) {
        var accessTokenMatch = /[?&]access_token=(.*?)(?:$|&)/.exec(window.location.search);
        if (accessTokenMatch) {
            var accessToken = accessTokenMatch[1];
            RED.settings.set("auth-tokens",{access_token: accessToken});
            window.location.search = "";
        }
        
	    var exentriqToken = null;
        var exentriqTokenMatch = /[?&]sessionToken=(.*?)(?:$|&)/.exec(window.location.search);
        if (exentriqTokenMatch) {
            exentriqToken = exentriqTokenMatch[1];
            RED.settings.set("auth-tokens",{access_token: null});
        }
        
        var exentriqUsername = null;
        var exentriqUsernameMatch = /[?&]username=(.*?)(?:$|&)/.exec(window.location.search);
        if (exentriqUsernameMatch) {
            exentriqUsername = exentriqUsernameMatch[1];
        }
        
        var exentriqCompany = null;
        var exentriqCompanyMatch = /[?&]company=(.*?)(?:$|&)/.exec(window.location.search);
        if (exentriqCompanyMatch) {
            exentriqCompany = exentriqCompanyMatch[1];
        }
        
        var css = '';
        var cssMatch = /[?&]css=(.*?)(?:$|&)/.exec(window.location.search);
        if (cssMatch) {
            css = cssMatch[1];
        }
        
        var servicePath = '';
        var servicePathMatch = /[?&]servicePath=(.*?)(?:$|&)/.exec(window.location.search);
        if (servicePathMatch) {
            servicePath = servicePathMatch[1];
        }

        var group = '';
        var groupMatch = /[?&]group=(.*?)(?:$|&)/.exec(window.location.search);
        if (groupMatch) {
            group = groupMatch[1];
        }

        console.log(exentriqToken);

        $.ajaxSetup({
            beforeSend: function(jqXHR,settings) {
                // Only attach auth header for requests to relative paths
                if (!/^\s*(https?:|\/|\.)/.test(settings.url)) {
                    var auth_tokens = RED.settings.get("auth-tokens");
                    if (auth_tokens) {
                        jqXHR.setRequestHeader("Authorization","Bearer "+auth_tokens.access_token);
                    }
                }
            }
        });
        
        RED.settings.servicePath=servicePath;
        load(done, exentriqUsername, exentriqToken, exentriqCompany, css, servicePath, group);
    }

    var load = function(done, exentriqUsername, exentriqToken, exentriqCompany, css, servicePath, group) {
        $.ajax({
            headers: {
                "Accept": "application/json"
            },
            dataType: "json",
            cache: false,
            url: 'settings',
            success: function (data) {        	
                setProperties(data);
                if (RED.settings.user && RED.settings.user.anonymous) {
                    RED.settings.remove("auth-tokens");
                }
                console.log("Node-RED: " + data.version);

                console.log(RED.settings.settings);

                var company_id = RED.settings.company.id;
                var group_id = RED.settings.company.group;
                var session_token = RED.settings.company.sessionToken;

                var robot_payload = {"id":5253425345345,"method":"processRobotService.getProcessRobot","params":[company_id, group_id]};
                console.log(RED.settings.exentriq);

                $.ajax({
                    url: RED.settings.exentriq.rpc+'?sid='+session_token,
                    type: 'POST',
                    data:JSON.stringify(robot_payload),
                    success: function(data){
                        console.log(data);
                        console.log();
                        var robot_name = data.result.name;
                        $('#header').prepend('<div id="robot" class="robot"><a id="robot-back" href="#" class="robot-back"><i class="material-icons">keyboard_arrow_left</i></a><a class="robot-name" href="#">'+robot_name+'</a></div>');
                        $('#robot-back').click(function(){window.parent.postMessage(JSON.stringify({action:"close"}),'*'); console.log("back");return false;});
                    },
                    error:function(error){
                        console.log(error);
                        var robot_name = "TEST";
                        $('#header').prepend('<div id="robot" class="robot"><a id="robot-back" href="#" class="robot-back"><i class="material-icons">keyboard_arrow_left</i></a><a class="robot-name" href="#">'+robot_name+'</a></div>');
                        $('#robot-back').click(function(){window.parent.postMessage(JSON.stringify({action:"close"}),'*'); console.log("back");return false;});

                    },
                    dataType: 'json'
                });
 

                done();
            },
            error: function(jqXHR,textStatus,errorThrown) {
                if (jqXHR.status === 401) {
                    if (/[?&]access_token=(.*?)(?:$|&)/.test(window.location.search)) {
                        window.location.search = "";
                    }
                    
                	if(exentriqToken){
                	    
                	var userAndCompany = JSON.stringify({"username":exentriqUsername, "company":exentriqCompany, "group":group});    
                	    
                	var body = {
                                client_id: "node-red-editor",
                                grant_type: "password",
                                scope:"",
                                username: userAndCompany,
                                password: exentriqToken
                            }
                            $.ajax({
                                url:"auth/token",
                                type: "POST",
                                data: body
                            }).done(function(data,textStatus,xhr) {
                                RED.settings.set("auth-tokens",data);
                                $("#node-dialog-login").dialog('destroy').remove();
                                window.location.replace("/?css="+css+'&servicePath='+servicePath);
                            }).fail(function(jqXHR,textStatus,errorThrown) {
                                RED.settings.remove("auth-tokens");
                                $("#node-dialog-login-failed").show();
                            }).always(function() {
                                $("#node-dialog-login-submit").button("option","disabled",false);
                            });
                    }
                    else{
                	RED.user.login(function() { load(done); });
                    }
                    
                } else {
                    console.log("Unexpected error:",jqXHR.status,textStatus);
                }
            }
        });
    };

    function theme(property,defaultValue) {
        if (!RED.settings.editorTheme) {
            return defaultValue;
        }
        var parts = property.split(".");
        var v = RED.settings.editorTheme;
        try {
            for (var i=0;i<parts.length;i++) {
                v = v[parts[i]];
            }
            if (v === undefined) {
                return defaultValue;
            }
            return v;
        } catch(err) {
            return defaultValue;
        }
    }

    return {
        init: init,
        load: load,
        set: set,
        get: get,
        remove: remove,
        theme: theme
    }
})
();
