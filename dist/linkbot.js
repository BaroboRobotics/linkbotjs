baroboBridge = (function(main) {
    var _i, _j, _len, _len1;
    if (main.baroboBridge !== null) {
      return main.baroboBridge;
    } else {
      methods = ['angularSpeed', 'availableFirmwareVersions', 'buttonChanged', 'connectRobot', 'disconnectRobot', 'enableButtonSignals', 'enableMotorSignals', 'disableButtonSignals', 'disableMotorSignals', 'firmwareVersion', 'getMotorAngles', 'scan', 'setMotorEventThreshold', 'stop'];
      signals = ['motorChanged', 'buttonChanged'];
      obj = {
        mock: true
      };
      var emptyFunction = function() { };
      for (_i = 0, _len = methods.length; _i < _len; _i++) {
        k = methods[_i];
        obj[k] = emptyFunction;
      }
      for (_j = 0, _len1 = signals.length; _j < _len1; _j++) {
        k = signals[_j];
        obj[k] = {
          connect: emptyFunction,
          disconnect: emptyFunction
        };
      }
      return obj;
    }
})(this);;function RobotStatus() {
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
;function RobotManager(document) {
    var manager = this;
    var events = {'dragstart': [], 'dragover': [], 'drop': [], 'add': [], 'remove': []};


    // Private
    function dragStart(e) {
      var evt = events.dragstart;
      for (var i = 0; i < evt.length; i++) {
        evt[i](e);
      }
    }

    function dragOver(e) {
      var evt = events.dragover;
      for (var i = 0; i < evt.length; i++) {
        evt[i](e);
      }
    }

    function drop(e) {
      var evt = events.drop;
      for (var i = 0; i < evt.length; i++) {
        evt[i](e);
      }
    }

    function _uiAdd(e) {
      var idInput;
      e.preventDefault();
      idInput = manager.element.querySelector('input#robotInput');
      manager.add(idInput.value);
      idInput.value = "";
      manager.connect();
      manager.redraw();
    }

    function _uiMenuSlide(e) {
      var container, left, spanBtn;
      e.preventDefault();
      spanBtn = manager.element.querySelector('span');
      container = document.querySelector('.robomgr-container');
      left = /robomgr-left/.test(spanBtn.className);
      if (left) {
        spanBtn.className = 'robomgr-pulloutbtn robomgr-right';
        container.className = 'robomgr-container robomgr-container-hidden';
      } else {
        spanBtn.className = 'robomgr-pulloutbtn robomgr-left';
        container.className = 'robomgr-container robomgr-container-open';
      }
      return e;
    }

    function _uiRemoveFn(e, id) {
      e.preventDefault();
      manager.robots.remove(id);
      var evt = events.remove;
      for (var i = 0; i < evt.length; i++) {
        evt[i](id);
      }
      manager.redraw();
    }

    function _robotLi(doc, r) {
      var li, rm;
      li = doc.createElement('li');
      rm = doc.createElement('span');
      rm.innerText = '[-]';
      rm.setAttribute('class', "robomgr--rmBtn robomgr--hoverItem");
      rm.addEventListener('click', function(e) { _uiRemoveFn(e, r.id); });
      li.setAttribute('draggable', 'true');
      li.setAttribute('class', "robomgr--" + r.status);
      li.setAttribute('id', 'robomgr-id-' + r.id);
      li.innerText = r.id;
      li.appendChild(rm);
      li.addEventListener('dragstart', dragStart);
      li.addEventListener('dragover', dragOver);
      li.addEventListener('drop', drop);
      li.addEventListener('mouseover', function(e) {
        e.stopPropagation();
        if (e.currentTarget === li) {
          return e.currentTarget.classList.add("robomgr--roboHover");
        }
      });
      li.addEventListener('mouseout', function(e) {
        e.stopPropagation();
        if (e.currentTarget === li) {
          return e.currentTarget.classList.remove("robomgr--roboHover");
        }
      });
      return li;
    }

    function _constructElement(doc) {
      var addBtn, el, pulloutBtn;
      el = doc.createElement('div');
      el.setAttribute('class', 'robomgr-container robomgr-container-hidden');
      el.innerHTML = '<div class="robomgr-pullout">' + '<span class="robomgr-pulloutbtn robomgr-right"></span>' + '</div>' + '<form>' + '<div id="robotFormContainer">' + '<label for="robotInput" id="robotInputLabel" class="sr-only">Linkbot ID</label>' + '<input name="robotInput" id="robotInput" type="text" placeholder="Linkbot ID" />' + '<button id="robomgr-add">Add</button>' + '</div>' + '</form><ol></ol>';
      addBtn = el.querySelector('button');
      pulloutBtn = el.querySelector('.robomgr-pullout');
      addBtn.addEventListener('click', _uiAdd);
      pulloutBtn.addEventListener('click', _uiMenuSlide);
      return el;
    }

    // Public
    this.robots = new RobotStatus();
    this.element = _constructElement(document);


    this.acquire = function(n) {
      var x = manager.robots.acquire(n);
      manager.redraw();
      return x;
    };

    this.relinquish = function(l) {
      l.disconnect();
      manager.robots.relinquish(l);
      manager.redraw();
    };

    this.add = function() {
      var ids = (1 <= arguments.length) ? [].slice.call(arguments, 0) : [];
      var evt = events.add;
      ids.map(function(i) {
        manager.robots.add(i);
        for (var j = 0; j < evt.length; j++) {
          evt[j](i);
        }
      });
    };

    this.redraw = function() {
      var doc = manager.element.ownerDocument;
      var ol = doc.createElement('ol');
      var robotList = manager.robots.list();
      for (var i = 0; i < robotList.length; i++) {
        var r = robotList[i];
        ol.appendChild(_robotLi(doc, r));
      }
      manager.element.replaceChild(ol, manager.element.querySelector('ol'));
    };

    this.connect = function() {
      var robotList = manager.robots.list();
      var results = [];
      for (var i = 0; i < robotList.length; i++) {
        var r = robotList[i];
        if (r.status === "new") {
          bot = new Linkbot(r.id);
          if (bot._id !== null) {
            results.push(manager.robots.ready(i, bot));
          } else {
            results.push(manager.robots.fail(i));
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    this.registerEvent = function(type, func) {
      var evt = events[type];
      if (evt) {
        evt.push(func);
      }
    };

    this.unregisterEvent = function(type, func) {
      var evt = events[type];
      if (evt) {
        evt.pop(func);
      }
    };

};function Linkbot(_id) {
  // Private
  var bot = this;

  bot._id = _id;
  err = baroboBridge.connectRobot(_id);
  if (err < 0) {
    bot._id = null;
    return;
  }
  for (var m = 1; m <= 3; m++) {
    baroboBridge.setMotorEventThreshold(bot._id, m, 1e10);
  }
  bot._wheelPositions = baroboBridge.getMotorAngles(bot._id);
  bot._firmwareVersion = baroboBridge.firmwareVersion(bot._id);
  if (!baroboBridge.mock) {
    var blessedFW = baroboBridge.availableFirmwareVersions();
    if (blessedFW.indexOf(bot._firmwareVersion) < 0) {
      idAsURI = encodeURIComponent(bot._id);
      baroboBridge.stop(bot._id);
      document.location = "../LinkbotUpdate/index.html?badRobot=" + idAsURI;
    }
  }

  function buttonSlot(robot, buttonId, callback, model) {
    if (model === null) {
      model = {};
    }
    return function(robID, btnID, press) {
      if (press === 1 && robot._id === robID && buttonId === btnID) {
        return callback(robot, model, {
          button: btnID
        });
      }
    };
  }

  function wheelSlot(robot, wheelId, callback, model) {
    if (model === null) {
      model = {};
    }
    return function(robID, _wheelId, angle) {
      var diff;
      if (robot._id === robID && wheelId === _wheelId) {
        diff = angle - robot._wheelPositions[wheelId - 1];
        robot._wheelPositions[wheelId - 1] = angle;
        return callback(robot, model, {
          triggerWheel: wheelId,
          position: angle,
          difference: diff
        });
      }
    };
  }

  // Public

  this._wheelRadius = 1.75;

  this.color = function(r, g, b) {
    baroboBridge.setLEDColor(bot._id, r, g, b);
  };

  this.angularSpeed = function(s1, s2, s3) {
      if (s2 === null) {
        s2 = s1;
      }
      if (s3 === null) {
        s3 = s1;
      }
      return baroboBridge.angularSpeed(bot._id, s1, s2, s3);
  };

  this.move = function(r1, r2, r3) {
    return baroboBridge.move(bot._id, r1, r2, r3);
  };

  this.moveTo = function(r1, r2, r3) {
    return baroboBridge.moveTo(bot._id, r1, r2, r3);
  };

  this.wheelPositions = function() {
    bot._wheelPositions = baroboBridge.getMotorAngles(bot._id);
    return bot._wheelPositions;
  };

  this.stop = function() {
    return baroboBridge.stop(bot._id);
  };

  this.buzzerFrequency = function(freq) {
    return baroboBridge.buzzerFrequency(bot._id, freq);
  };

  this.disconnect = function() {
    bot.stop();
    bot._id = null;
    return bot._id; 
  };

  this.register = function(connections) {
    var buttonId, registerObject, slot, wheelId, _ref, _ref1, _results, _wheelId;
    if (connections.button !== null) {
      _ref = connections.button;
      for (buttonId in _ref) {
        if (!__hasProp.call(_ref, buttonId)) continue;
        registerObject = _ref[buttonId];
        slot = buttonSlot(bot, parseInt(buttonId), registerObject.callback, registerObject.data);
        baroboBridge.buttonChanged.connect(slot);
        baroboBridge.enableButtonSignals(bot._id);
      }
    }
    if (connections.wheel !== null) {
      _ref1 = connections.wheel;
      _results = [];
      for (_wheelId in _ref1) {
        if (!__hasProp.call(_ref1, _wheelId)) continue;
        registerObject = _ref1[_wheelId];
        wheelId = parseInt(_wheelId);
        slot = wheelSlot(bot, wheelId, registerObject.callback, registerObject.data);
        baroboBridge.setMotorEventThreshold(bot._id, wheelId, registerObject.distance);
        baroboBridge.motorChanged.connect(slot);
        _results.push(baroboBridge.enableMotorSignals(bot._id));
      }
      return _results;
    }
  };

  this.unregister = function() {
    baroboBridge.motorChanged.disconnect();
    baroboBridge.disableMotorSignals(bot._id);
    baroboBridge.buttonChanged.disconnect();
    return baroboBridge.disableButtonSignals(bot._id);
  };
}
;function Storage(config) {
  var settings = (config) ? config : {
    DBNAME: "robotsdb",
    DBVER: 1.0,
    DBDESC: "Robots Database, used for persistance",
    TABLE: "robots"
  };

  var db = openDatabase(settings.DBNAME, settings.DBVER, settings.DBDESC, settings.DBSIZE);
  db.transaction(function(tx) {
    tx.executeSql("CREATE TABLE IF NOT EXISTS " + settings.TABLE + " (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT unique not null, status INTEGER not null, rorder INTEGER not null)",
      [],
      function(tx, results) {
      },
      function(tx, error) {
        console.log(error);
      }
    );
  });
  this.remove = function(name, callback) {
    db.transaction(function(tx) {
      tx.executeSql("DELETE FROM " + settings.TABLE + " WHERE name = ?", [name],
        function(tx, result) {
          callback(true);
        },
        function(tx, error) {
          callback(false, error);
        });
    });
  };
  this.add = function(name, status, callback) {
    db.transaction(function(tx) {
      tx.executeSql("SELECT COUNT(*) AS c FROM " + settings.TABLE, [],
      function(tx, countResult) {
        tx.executeSql("INSERT INTO " + settings.TABLE + " (name, status, rorder) values (?,?,?)", [name, status, countResult.rows.item(0).c],
          function(tx, insertResult) {
            if (callback) {
              callback(true);
            }
          },
          function(tx, insertError) {
            if (callback) {
              callback(false, insertError);
            }
          });
      },
      function(tx, error) {
        if (callback) {
          callback(false, error);
        }
      });
    });
  };
  this.getAll = function(callback) {
    db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM " + settings.TABLE + " ORDER BY rorder", [],
        function(tx, result) {
          var rows = result.rows;
          var allRobots = [];
          for (var i = 0; i < result.rows.length; i++) {
            allRobots.push({ "id":rows.item(i).id, "name": rows.item(i).name, "status":rows.item(i).status, "order":rows.item(i).rorder});
          }
          if (callback) {
            callback(allRobots);
          }
        },
        function(tx, error) {
          if (callback) {
            callback([], error);
          }
        });
    });
  };
  // For debugging.
  this.printRows = function() {
    db.transaction(function(tx) {
      tx.executeSql("SELECT * FROM " + settings.TABLE + " ORDER BY rorder", [],
        function(tx, result) {
          var rows = result.rows;
          for (var i = 0; i < result.rows.length; i++) {
            console.log('ID:' + rows.item(i).id + ', NAME:' + rows.item(i).name + ', STATUS:' + rows.item(i).status + ', ORDER:' + rows.item(i).rorder);
          }
        },
        function(tx, error) {
          console.log(error);
        });
    });
  };
  this.changePosition = function(currentPosition, newPosition, callback) {
    if (currentPosition === newPosition) {
      return;
    }
    db.transaction(function(tx) {
      var start = currentPosition;
      var end = newPosition;
      if (currentPosition > newPosition) {
        start = newPosition;
        end = currentPosition;
      }
      tx.executeSql("SELECT * from " + settings.TABLE + " WHERE rorder BETWEEN ? and ? ORDER BY rorder", [start, end],
        function(tx, result) {
          var i = 0;
          var _modifier = -1;
          var rows = result.rows;
          if (currentPosition > newPosition) {
            _modifier = 1;
          }
          var success = function(tx, results) {
            if (callback) {
              callback(true, results);
            }
          };
          var error = function(tx, error) {
            if (callback) {
              callback(false, results);
            }
          };
          for (i = 0; i < result.rows.length; i++) {
            var setorder = rows.item(i).rorder + _modifier;
            var setid = rows.item(i).id;
            if (rows.item(i).rorder == currentPosition) {
              setorder = newPosition;
            }
            tx.executeSql("UPDATE " + settings.TABLE + " SET rorder = ? WHERE id = ?", [setorder, setid],
              success,
              error);
          }
          if (callback) {
            callback(true);
          }
        },
        function(tx, error) {
          if (callback) {
            callback(false,error);
          }
        });
    });
  };
}
;var Linkbots = (function(exports, doc) {
    var manager = new RobotManager(doc);
    var storage = new Storage();
    var source = null;

    function move(srcId, destId) {
      storage.getAll(function(robots) {
        srcOrder = -1;
        destOrder = -1;
        for (var i = 0; i < robots.length; i++) {
          if (robots[i].name === srcId) {
            srcOrder = robots[i].order;
          } else if (robots[i].name === destId) {
            destOrder = robots[i].order;
          }
          if (destOrder >= 0 && srcOrder >= 0) {
            break;
          }
        }
        if (destOrder >= 0 && srcOrder >= 0) {
          storage.changePosition(srcOrder, destOrder, function(success) {
            if (success === true) {
              var src = manager.robots.robots.splice(srcOrder, 1);
              manager.robots.robots.splice(destOrder, 0, src[0]);
            }
          });
        }
      });
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        e.dataTransfer.effectAllowed = 'move';
        source = e.target;
    }

    function dragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
    }

    function drop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (source != e.target) {
            var srcId = source.getAttribute('id').replace(/robomgr-id-/, '');
            var destId = e.target.getAttribute('id').replace(/robomgr-id-/, '');
            var id = source.getAttribute('id');
            var clazz = source.getAttribute('class');
            source.setAttribute('id', e.target.getAttribute('id'));
            source.setAttribute('class', e.target.getAttribute('class'));
            source.innerHTML = e.target.innerHTML;
            e.target.setAttribute('id', id);
            e.target.setAttribute('class', clazz);
            e.target.innerHTML = e.dataTransfer.getData('text/html');
            move(srcId, destId);
        }
        return false;
    }

    function add(id) {
      storage.add(id, 0);
    }

    function remove(id) {
      storage.remove(id);
    }

    storage.getAll(function(robots) {
      for (var i = 0; i < robots.length; i++) {
        manager.add(robots[i].name);
      }
      manager.connect();
      manager.redraw();
    });

    manager.registerEvent('dragstart', dragStart);
    manager.registerEvent('dragover', dragOver);
    manager.registerEvent('drop', drop);
    manager.registerEvent('add', add);
    manager.registerEvent('remove', remove);  

    exports.scan = function() {
        return baroboBridge.scan();
    };
    exports.managerElement = function() {
        return manager.element;
    };
    exports.acquire = function(n) {
        return manager.acquire(n);
    };
    exports.relinquish = function(l) {
        return manager.relinquish(l);
    };
    exports.managerAdd = function() {
        var ids = (1 <= arguments.length) ? [].slice.call(arguments, 0) : [];
        return manager.add.apply(manager, ids);
    };
    exports.managerRedraw = function() {
        return manager.redraw();
    };
    exports.managerConnect = function() {
        return manager.connect();
    };
    exports.storage = storage;

    return exports;
})(Linkbots || {}, document);
