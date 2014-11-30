baroboBridge = (function(main) {
    var _i, _j, _len, _len1;
    if (main.baroboBridge && main.baroboBridge !== null) {
      return main.baroboBridge;
    } else {
      methods = ['angularSpeed', 'availableFirmwareVersions', 'buttonChanged', 'buzzerFrequency',
        'connectRobot', 'disconnectRobot', 'enableButtonSignals', 'enableMotorSignals', 'enableAccelSignals', 'disableAccelSignals',
        'disableButtonSignals', 'disableMotorSignals', 'firmwareVersion', 'getMotorAngles', 'moveTo',
        'scan', 'setMotorEventThreshold', 'stop', 'moveContinuous'];
      signals = ['accelChanged', 'motorChanged', 'buttonChanged'];
      obj = {
        mock: true
      };
      var randomInt = function(min,max) {
        return Math.floor(Math.random()*(max-min+1)+min);
      };
      var colorMap = {};
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
      obj.getLEDColor = function(id) {
        if (!colorMap[id]) {
          colorMap[id] = {red:randomInt(0,255), green:randomInt(0,255), blue:randomInt(0,255)};
        }
        return colorMap[id];
      };
      obj.setLEDColor = function(id, r, g, b) {
        colorMap[id] = {red:r, green:g, blue:b};
      };
      return obj;
    }
})(this);