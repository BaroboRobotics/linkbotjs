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
})(this);