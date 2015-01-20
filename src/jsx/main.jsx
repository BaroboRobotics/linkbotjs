"use strict";
    
var manager = require('./manager.jsx');
var uimanager = require('./manager-ui.jsx');

window.Linkbots = (function(){
    var mod = {};

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
    
    return mod;

})();