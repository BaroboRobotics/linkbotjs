"use strict";
    
var manager = require('./manager.jsx');
var uimanager = require('./manager-ui.jsx');
var config = require('./config.jsx');

window.Linkbots = (function(){
    var mod = {};
    var startOpen = false;

    mod.addRobot = function(id) {
        manager.addRobot(id);
    };
    mod.removeRobot = function(id) {
        manager.removeRobot(id);
    };
    mod.openSideMenu = function() {
        uimanager.uiEvents.trigger('show-menu');
    };
    mod.closeSideMenu = function() {
        uimanager.uiEvents.trigger('hide-menu');
    };
    mod.acquire = function(count) {
        return manager.acquire(count);
    };
    mod.relinquish = function(bot) {
        return manager.relinquish(bot);
    };
    mod.scan = function() {
        return baroboBridge.scan();
    };
    mod.startOpen = function(value) {
        startOpen = value;
    };
    mod.setNavigationTitle = function(title) {
        manager.setNavigationTitle(title);
    };
    mod.addNavigationItem = function(navItemObject) {
        manager.addNavigationItem(navItemObject);
    };
    mod.setNavigationItems = function(navItemArray) {
        manager.setNavigationItems(navItemArray);
    };
    mod.addNavigationItems = function(navItemArray) {
        manager.addNavigationItems(navItemArray);
    };
    mod.setPathways = function(pathways) {
        if (!Array.isArray(pathways)) {
            pathways = [pathways];
        }
        if (!config.set('pathways', pathways)) {
            uimanager.uiEvents.trigger('add-error', 'Unable to write pathways to the configuration file');
        }
    };
    mod.getPathways = function() {
        var pathways = config.get('pathways');
        if (typeof pathways === 'undefined') {
            return [];
        }
        return pathways;
    };
    mod.managerEvents = manager.event;
    mod.uiEvents = uimanager.uiEvents;

    if(window.attachEvent) {
        window.attachEvent('onload', function() {
            uimanager.addUI();
            if (startOpen) {
                uimanager.uiEvents.trigger('show-menu');
            }
        });
    } else {
        if(window.onload) {
            var originalOnLoad = window.onload;
            window.onload = function() {
                originalOnLoad();
                uimanager.addUI();
                if (startOpen) {
                    uimanager.uiEvents.trigger('show-menu');
                }
            };
        } else {
            window.onload = function() {
                uimanager.addUI();
                if (startOpen) {
                    uimanager.uiEvents.trigger('show-menu');
                }
            }
        }
    }

    return mod;

})();