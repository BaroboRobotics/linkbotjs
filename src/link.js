function Linkbot(_id) {
  // Private
  var bot = this;
  var ledCallbacks = [];
  var wheelSlotCallback = null;
  var buttonSlotCallback = null;
  var accelSlotCallback = null;
  var joinDirection = [0, 0, 0];

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

  function accelSlot(robot, callback, model) {
    if (model === null) {
      model = {};
    }
    return function(robotID, x, y, z) {
      if (robotID === robot._id) {
        return callback(robot, model, {
          x: x,
          y: y,
          z: z
        });
      }
    };
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
    for (var i in ledCallbacks) {
      ledCallbacks[i](bot._id, r, g, b);
    }
  };

  this.getColor = function() {
    var color = null;
    if (baroboBridge.getLEDColor) {
      color = baroboBridge.getLEDColor(bot._id);
    }
    if (!color || color === null) {
      color = {red:96, green:96, blue:96, mock:true};
    }
    color.id = bot._id;
    return color;
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

  this.moveForward = function() {
    joinDirection[0] = 1;
    joinDirection[2] = -1;
    baroboBridge(bot._id, joinDirection[0], joinDirection[1], joinDirection[2]);
  };
  this.moveBackward = function() {
    joinDirection[0] = -1;
    joinDirection[2] = 1;
    baroboBridge(bot._id, joinDirection[0], joinDirection[1], joinDirection[2]);
  };
  this.moveLeft = function() {
    joinDirection[0] = -1;
    joinDirection[2] = -1;
    baroboBridge(bot._id, joinDirection[0], joinDirection[1], joinDirection[2]);
  };
  this.moveRight = function() {
    joinDirection[0] = 1;
    joinDirection[2] = 1;
    baroboBridge(bot._id, joinDirection[0], joinDirection[1], joinDirection[2]);
  };
  this.moveJointContinuous = function(joint, direction) {
    if (joint >= 0 && joint <= 2) {
      if (direction > 0) {
        joinDirection[joint] = 1;
      } else if (direction < 0) {
        joinDirection[joint] = -1;
      } else {
        joinDirection[joint] = 0;
      }
      baroboBridge(bot._id, joinDirection[0], joinDirection[1], joinDirection[2]);
      return true;
    }
    return false;
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
    var buttonId, registerObject, slot, wheelId, _ref, _results, _wheelId;
    if (connections.button && connections.button !== null) {
      _ref = connections.button;
      if (buttonSlotCallback === null) {
        buttonSlotCallback = [];
      }
      for (buttonId in _ref) {
        //if (!__hasProp.call(_ref, buttonId)) continue;
        registerObject = _ref[buttonId];
        slot = buttonSlot(bot, parseInt(buttonId), registerObject.callback, registerObject.data);
        baroboBridge.buttonChanged.connect(slot);
        buttonSlotCallback.push(slot);
        baroboBridge.enableButtonSignals(bot._id);
      }
    }
    if (connections.wheel && connections.wheel !== null) {
      _ref = connections.wheel;
      _results = [];
      if (wheelSlotCallback === null) {
        wheelSlotCallback = [];
      }
      for (_wheelId in _ref) {
        // if (!__hasProp.call(_ref, _wheelId)) continue;
        registerObject = _ref[_wheelId];
        wheelId = parseInt(_wheelId);
        slot = wheelSlot(bot, wheelId, registerObject.callback, registerObject.data);
        baroboBridge.setMotorEventThreshold(bot._id, wheelId, registerObject.distance);
        baroboBridge.motorChanged.connect(slot);
        wheelSlotCallback.push(slot);
        _results.push(baroboBridge.enableMotorSignals(bot._id));
      }
    }
    if (connections.accel && connections.accel !== null) {
      _ref = connections.accel;
      accelSlotCallback = accelSlot(bot, _ref.callback, _ref.data);
      baroboBridge.accelChanged.connect(accelSlotCallback);
      baroboBridge.enableAccelSignals(bot._id);
    }
    if (connections.led && connections.led !== null) {
      _ref = connections.led;
      ledCallbacks.push(_ref.callback);
    }
    return _results;
  };

  this.unregister = function() {
    try {
      if (wheelSlotCallback && wheelSlotCallback !== null) {
        baroboBridge.disableMotorSignals(bot._id);
        for (var a in wheelSlotCallback) {
          baroboBridge.motorChanged.disconnect(wheelSlotCallback[a]);
        }
        wheelSlotCallback = null;
      }
    } catch (err) {
      console.log(err);
    }
    try {
      if (buttonSlotCallback && buttonSlotCallback !== null) {
        baroboBridge.disableButtonSignals(bot._id);
        for (var b in buttonSlotCallback) {
          baroboBridge.buttonChanged.disconnect(buttonSlotCallback[b]);
        }
        buttonSlotCallback = null;
      }
      
    } catch (err) {
      console.log(err);
    }
    try {
      if (accelSlotCallback !== null) {
        baroboBridge.disableAccelSignals(bot._id);
        baroboBridge.accelChanged.disconnect(accelSlotCallback);
      }
    } catch (err) {
      console.log(err);
    }
    ledCallbacks = [];
  };
}
