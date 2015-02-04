"use strict";

var botlib = require('./linkbot.jsx');
var eventlib = require('./event.jsx');
var storageLib = require('./storage.jsx');

var robots = [];

var events = eventlib.Events.extend({});

function findRobot(id) {
    for (var i = 0; i < robots.length; i++) {
        if (robots[i].id == id) {
            return robots[i];
        }
    }
    return undefined;
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

module.exports.refresh = function() {
    for (var i = 0; i < robots.length; i++) {
        robots[i].connect();
    }
};

module.exports.disconnectAll = function() {
    for (var i = 0; i < robots.length; i++) {
        robots[i].disconnect();
    }
}

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

storageLib.getAll(function(bots) {
    for (var i = 0; i < bots.length; i++) {
        robots.push(new botlib.AsyncLinkbot(bots[i].name));
    }
    if (bots.length > 0) {
        events.trigger('changed', 1);
    }
});

events.on('dongle', function() {
    // Refresh
    for (var i = 0; i < robots.length; i++) {
        robots[i].connect();
    }
});
