/**
 * Copyright 2013 IBM Corp.
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

var when = require('when');

var storageModule;

function moduleSelector(aSettings) {
    var toReturn;
    if (aSettings.storageModule) {
        if (typeof aSettings.storageModule === "string") {
            // TODO: allow storage modules to be specified by absolute path
            toReturn = require("./"+aSettings.storageModule);
        } else {
            toReturn = aSettings.storageModule;
        }
    } else {
        toReturn = require("./localfilesystem");
    }
    return toReturn;
}

var storageModuleInterface = {
        init : function(settings) {
            try {
                storageModule = moduleSelector(settings);
            } catch (e) {
                return when.reject(e);
            }
            return storageModule.init(settings);
        },
        getFlows : function() {
            return storageModule.getFlows();
        },
        saveFlows : function(flows) {
            return storageModule.saveFlows(flows);
        },
        getCredentials : function() {
            return storageModule.getCredentials();
        },
        saveCredentials : function(credentials) {
            return storageModule.saveCredentials(credentials);
        },
        getAllFlows : function() {
            return storageModule.getAllFlows();
        },
        getFlow : function(fn) {
            return storageModule.getFlow(fn);
        },
        saveFlow : function(fn, data) {
            return storageModule.saveFlow(fn, data);
        },
        getLibraryEntry : function(type, path) {
            return storageModule.getLibraryEntry(type, path);
        },
        saveLibraryEntry : function(type, path, meta, body) {
            return storageModule.saveLibraryEntry(type, path, meta, body);
        }
}

module.exports = storageModuleInterface;
