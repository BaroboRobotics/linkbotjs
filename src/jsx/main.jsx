"use strict";
    
var manager = require('./manager.jsx');
var uimanager = require('./manager-ui.jsx');

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