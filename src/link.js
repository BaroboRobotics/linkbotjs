function Linkbot(_id) {
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
