"use strict";

var botlib = require('./linkbot.jsx');
var eventlib = require('./event.jsx');
var managerUi = require('./manager-ui.jsx');
var storageLib = require('./storage.jsx');
var config = require('./config.jsx');

var robots = [];
var pingRobots = [];
var navigationItems =  [];
var title = document.title;

if (title.length === 0) {
    title = "Linkbot Labs";
}
navigationItems.push({'title':title, 'url':'#'});

var events = eventlib.Events.extend({});

function findRobot(id) {
    for (var i = 0; i < robots.length; i++) {
        if (robots[i].id == id) {
            return robots[i];
        }
    }
    return undefined;
}

function readRobotsFromConfig() {
    var robots = config.get('robots');
    if (typeof robots !== 'undefined') {
        return robots.map(function (id) { return new botlib.AsyncLinkbot(id); });
    }
    else {
        return [];
    }
}

function writeRobotsToConfig(bots) {
    if (Array.isArray(bots)) {
        if (!config.set('robots', bots.map(function (b) { return b.id; }))) {
            console.warn("Unable to write robots array to configuration");
        }
    } else {
        console.warn("Invalid robots array not writing to configuration");
    }
}

function disconnectAll() {
    for (var i = 0; i < robots.length; i++) {
        robots[i].disconnect();
    }
}

module.exports.moveRobot = function(from, to) {
    robots.splice(to, 0, robots.splice(from, 1)[0]);
    writeRobotsToConfig(robots);
    events.trigger('changed', 3);
    storageLib.changePosition(from, to, function(success){
        if (!success) {
            console.warn("Unable to write to HTML5 storage");
        }
    });
    
};

module.exports.addRobot = function(id) {
    if (typeof id == 'undefined' || id == null || id.length < 3 || /[a|e|i|o|u|0]/gi.test(id)) {
        return;
    }
    var identifier = id.toUpperCase();
    var robot = findRobot(identifier);
    if (!robot) {
        robots.push(new botlib.AsyncLinkbot(identifier));
        writeRobotsToConfig(robots);
        storageLib.add(identifier, 0);
        events.trigger('changed', 1);
        asyncBaroboBridge.sendRobotPing([identifier], botlib.addGenericCallback());
    }
};

module.exports.getRobot = function(id) {
    return findRobot(id);
};

module.exports.getRobots = function() {
    return robots;
};

module.exports.disconnectAll = disconnectAll;

function batchcallPings(error) {
    var p, token;
    if (error.code == 0) {
        if (pingRobots.length > 0) {
            p = pingRobots.splice(0, 8);
            if (p.length > 0) {
                asyncBaroboBridge.sendRobotPing(p, botlib.addCallback(batchcallPings));
            }
        }
    }
    else {
        window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
    }
}

function refresh () {
    // TODO: If any robot has an error while trying to connect, disconnect and
    // reconnect once. This should fix simple communications interruptions.
    var i = 0, token, pinged;
    pingRobots = [];
    for (i = 0; i < robots.length; i++) {
        pingRobots.push(robots[i].id);
    }
    pinged = pingRobots.splice(0, 8);
    if (pinged.length > 0) { // if pinged.length == 0, every robot will reply
        asyncBaroboBridge.sendRobotPing(pinged, botlib.addCallback(batchcallPings));
    }
}

module.exports.refresh = refresh;

module.exports.event = events;

module.exports.removeRobot = function(id) {
    var index, robot;
    robot = findRobot(id);
    if (robot) {
        robot.disconnect();
        index = robots.indexOf(robot);
        robots.splice(index, 1);
        writeRobotsToConfig(robots);
        storageLib.remove(id, function(success) {
           if (success) {
               storageLib.updateOrder();
           }
        });
        events.trigger('changed', 2);
    }
};

module.exports.acquire = function(n) {
    var readyBots = robots.filter(function(r) {
       return r.status === "ready";
    });
    var ret = {
        robots: [],
        registered: robots.length,
        ready: readyBots.length
    };
    if (ret.ready >= n) {
        var rs = readyBots.slice(0, n);
        rs.map(function(r) {
            r.status = "acquired";
            return r.status;
        });
        ret.robots = rs.map(function(r) {
            return r;
        });
        ret.ready -= n;
    }
    return ret;
};
module.exports.relinquish = function(bot) {
    var idx = robots.map(function(x) {
        return x.id;
    }).indexOf(bot.id);
    if (idx >= 0 && robots[idx].status === "acquired") {
        robots[idx].status = "ready";
        robots[idx].unregister();
        return robots[idx].status;
    } else {
        return false;
    }
};

module.exports.relinquishAll = function() {
    for (var i = 0; i < robots.length; i++) {
        var robot = robots[i];
        if (robot.status === "acquired") {
            robot.status = "ready";
            robot.unregister();
        }
    }
};

module.exports.getNavigationTitle = function() {
    return title;
};
module.exports.setNavigationTitle = function(newTitle) {
    title = newTitle;
};
module.exports.getNavigationItems = function() {
    return navigationItems;
};

module.exports.addNavigationItem = function(item) {
    if (item !== null && typeof(item) !== 'undefined' && typeof item === 'object') {
        if (item.title && item.url) {
            navigationItems.push(item);
            events.trigger('navigation-changed', 1);
        }
    }
};
module.exports.addNavigationItems = function(items) {
    var changed = false;
    if (items !== null && Array.isArray(items)) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item !== null && typeof(item) !== 'undefined' && typeof item === 'object') {
                if (item.title && item.url) {
                    navigationItems.push(item);
                    changed = true;
                }
            }
        }
        if (changed) {
            events.trigger('navigation-changed', 1);
        }
    }
};
module.exports.setNavigationItems = function(items) {
    navigationItems = [];
    if (items !== null && Array.isArray(items)) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item !== null && typeof(item) !== 'undefined' && typeof item === 'object') {
                if (item.title && item.url) {
                    navigationItems.push(item);
                }
            }
        }
    }
    events.trigger('navigation-changed', 1);
};
/**
 * Load Robots from Configuration or HTML5 Storage.
 * setTimeout is used to execute the code after all the modules have loaded.
 */
setTimeout(function() {
    robots = readRobotsFromConfig();
    if (!robots || robots.length == 0) {
        robots = [];
        storageLib.getAll(function (bots) {
            for (var i = 0; i < bots.length; i++) {
                robots.push(new botlib.AsyncLinkbot(bots[i].name));
            }
            if (bots.length > 0) {
                writeRobotsToConfig(robots);
                refresh();
                events.trigger('changed', 1);
            }
        });
    } else {
        refresh();
        events.trigger('changed', 1);
    }
}, 1);


events.on('dongleUp', function() {
    refresh();
    managerUi.uiEvents.trigger('hide-dongle-update');
});

events.on('dongleDown', function() {
    disconnectAll();
    managerUi.uiEvents.trigger('hide-dongle-update');
});
events.on('dongleUpdate', function(data) {
    managerUi.uiEvents.trigger('show-dongle-update', data);
});

asyncBaroboBridge.connectionTerminated.connect(function(id, timestamp) {
    console.log('disconnect robot triggered with ID: ' + id + ' and timestamp: ' + timestamp);
    var robot = findRobot(id);
    if (robot) {
        robot.disconnect();
    }
});
