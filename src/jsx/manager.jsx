"use strict";

var botlib = require('./linkbot.jsx');
var eventlib = require('./event.jsx');
var storageLib = require('./storage.jsx');

var robots = [];
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
function connectAll() {
    for (var i = 0; i < robots.length; i++) {
        robots[i].connect();
    }
}
function disconnectAll() {
    for (var i = 0; i < robots.length; i++) {
        robots[i].disconnect();
    }
}

module.exports.moveRobot = function(from, to) {
    storageLib.changePosition(from, to, function(success){
        if (success) {
            robots.splice(to, 0, robots.splice(from, 1)[0]);
            events.trigger('changed', 3);
        }
    });
    
};

module.exports.addRobot = function(id) {
    if (typeof id == 'undefined' || id == null || id.length < 3) {
        return;
    }
    var identifier = id.toUpperCase();
    var robot = findRobot(identifier);
    if (!robot) {
        robots.push(new botlib.AsyncLinkbot(identifier));
        storageLib.add(identifier, 0);
        events.trigger('changed', 1);
    }
};

module.exports.getRobot = function(id) {
    return findRobot(id);
};

module.exports.getRobots = function() {
    return robots;
};

module.exports.connectAll = connectAll;

module.exports.disconnectAll = disconnectAll;

module.exports.refresh = function() {
    // TODO: If any robot has an error while trying to connect, disconnect and
    // reconnect once. This should fix simple communications interruptions.
    connectAll();
};

module.exports.event = events;

module.exports.removeRobot = function(id) {
    var index, robot;
    robot = findRobot(id);
    if (robot) {
        index = robots.indexOf(robot);
        robots.splice(index, 1);
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
        return robots[idx].status;
    } else {
        return false;
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
storageLib.getAll(function(bots) {
    for (var i = 0; i < bots.length; i++) {
        robots.push(new botlib.AsyncLinkbot(bots[i].name));
    }
    if (bots.length > 0) {
        events.trigger('changed', 1);
    }
});

// Dongle events of the same value may occur consecutively (i.e., two
// dongleDowns in a row), so track the state and only perform actions on state
// changes.

var dongle = null;

events.on('dongleUp', function() {
    if (!dongle || dongle === 'down') {
        dongle = 'up';
        connectAll();
    }
});

events.on('dongleDown', function() {
    if (!dongle || dongle === 'up') {
        dongle = 'down';
        disconnectAll();
    }
});
