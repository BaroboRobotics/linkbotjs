"use strict";
    
var manager = require('./manager.jsx');
var uimanager = require('./manager-ui.jsx');
var config = require('./config.jsx');
/**
 * Linkbots API interface.
 * @namespace Linkbots
 */
window.Linkbots = (function(){
    var mod = {};
    var startOpen = false;

    /**
     * Adds a Robot to the robot manager.
     * @function addRobot
     * @memberOf Linkbots
     * @param id {string} The robot id to add.
     */
    mod.addRobot = function(id) {

        manager.addRobot(id);
    };
    /**
     * @function removeRobot
     * @memberOf Linkbots
     * @desc Removes a Robot from the robot manager.
     * @param id {string} The robot id to remove.
     */
    mod.removeRobot = function(id) {
        manager.removeRobot(id);
    };
    /**
     * Opens the robot manager side menu.
     * @function openSideMenu
     * @memberOf Linkbots
     */
    mod.openSideMenu = function() {
        uimanager.uiEvents.trigger('show-menu');
    };
    /**
     * Closes the robot manager side menu.
     * @function closeSideMenu
     * @memberOf Linkbots
     */
    mod.closeSideMenu = function() {
        uimanager.uiEvents.trigger('hide-menu');
    };

    /**
     * @typedef AcquiredType
     * @type Object
     * @property {Array.<AsyncLinkbot>} robots An array of robots.
     * @property {number} registered The total number of registered robots.
     * @property {number} ready The total number of robots in the ready state.
     */

    /**
     * Acquires available robots from the robot manager and marks them as acquired.
     * @function acquire
     * @memberOf Linkbots
     * @param count {int} The number of robots you wish to acquire.
     * @return {AcquiredType}
     */
    mod.acquire = function(count) {
        return manager.acquire(count);
    };
    /**
     * Relinquishes the robot back to the robot manager.  It's the opposite of acquire.
     * @function relinquish
     * @memberOf Linkbots
     * @param {AsyncLinkbot} bot The linkbot that you no longer are using and wish to make available.
     */
    mod.relinquish = function(bot) {
        return manager.relinquish(bot);
    };
    mod.relinquishAll = function() {
        return manager.relinquishAll();
    };
    /**
     * Scans for linkbots.
     * @function scan
     * @memberOf Linkbots
     */
    mod.scan = function() {
        return baroboBridge.scan();
    };
    /**
     * If True is passed in the robot manager menu starts open.
     * @function startOpen
     * @memberOf Linkbots
     * @param value {boolean}.
     */
    mod.startOpen = function(value) {
        startOpen = value;
    };
    /**
     * Sets the title in the top navigation.
     * @function setNavigationTitle
     * @memberOf Linkbots
     * @param title {string} The title to set.
     */
    mod.setNavigationTitle = function(title) {
        manager.setNavigationTitle(title);
    };
    /**
     * Adds a breadcrumb to the top navigation.
     * @function addNavigationItem
     * @memberOf Linkbots
     * @param navItemObject {object} An object containing a url and a title.
     */
    mod.addNavigationItem = function(navItemObject) {
        manager.addNavigationItem(navItemObject);
    };
    /**
     * Sets the breadcrumbs to the array of navigation items.  Replacing the existing breadcrumbs.
     * @function setNavigationItems
     * @memberOf Linkbots
     * @param navItemArray {array} An array of navigation objects.  A navigation object contains a url and title.
     */
    mod.setNavigationItems = function(navItemArray) {
        manager.setNavigationItems(navItemArray);
    };
    /**
     * Adds an array of breadcrumbs to the top navigation.
     * @function addNavigationItems
     * @memberOf Linkbots
     * @param navItemArray {array} An array of navigation objects.  A navigation object contains a url and title.
     */
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
    /**
     * TODO: document manager events.
     */
    mod.managerEvents = manager.event;
    /**
     * TODO document ui events.
     * @type {*|uiEvents|l}
     */
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