function RobotStatus() {
  var status = this;
  // Private


  // Public
  this.robots = [];

  this.list = function() {
    return status.robots;
  };

  this.acquire = function(n) {
    var readyBots = status.robots.filter(function(r) {
      return r.status === "ready";
    });
    var ret = {
        robots: [],
        registered: status.robots.length,
        ready: readyBots.length
    };
    if (ret.ready >= n) {
        rs = readyBots.slice(0, n);
        rs.map(function(r) {
          r.status = "acquired";
          return r.status;
        });
        ret.robots = rs.map(function(r) {
          return r.linkbot;
        });
        ret.ready -= n;
    }
    return ret;
  };

  this.add = function(id) {
    if (status.robots.map(function(x) {
      return x.id;
    }).indexOf(id) < 0) {
      return status.robots.push({
        status: "new",
        id: id
      });
    } else {
      return false;
    }
  };

  this.remove = function(id) {
    var idx = status.robots.map(function(x) {
      return x.id;
    }).indexOf(id);
    if (idx >= 0) {
      return status.robots.splice(idx, 1);
    } else {
      return false;
    }
    
  };

  this.relinquish = function(bot) {
    var idx = status.robots.map(function(x) {
      return x.id;
    }).indexOf(bot._id);
    if (idx >= 0 && status.robots[idx].status === "acquired") {
        status.robots[idx].status = "ready";
        return status.robots[idx].status;
      } else {
        return false;
      }
  };

  this.ready = function(idx, bot) {
    var robot = status.robots[idx];
    var result;
    if (robot !== null) {
      robot.linkbot = bot;
      robot.status ="ready";
    }
  };

  this.fail = function(idx) {
    var robot = status.robots[idx];
    if (robot !== null) {
      robot.status = "failed";
    }
  };
}
