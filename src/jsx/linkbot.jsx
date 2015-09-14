"use strict";

var eventlib = require('./event.jsx');
var manager = require('./manager.jsx');
var firmware = require('./firmware.jsx');
var Version = require('./version.jsx');

var enumConstants = asyncBaroboBridge.enumerationConstants();
var requestId = 0;
var callbacks = {};
var buttonEventCallbacks = {};
var encoderEventCallbacks = {};
var accelerometerEventCallbacks = {};
var jointEventCallbacks = {};


// Find the latest version of the firmware among all the firmware files.
var latestLocalFirmwareVersion = firmware.localVersionList()
                                         .reduce(Version.max);

function addCallback (func) {
    var token = requestId++;
    callbacks[token] = func;
    return token;
}

function addGenericCallback () {
    return addCallback(function (error) {
        if (error.code !== 0) {
            // TODO add error handling code here.
            window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
        }
    });
}

module.exports.addCallback = addCallback;
module.exports.addGenericCallback = addGenericCallback;

asyncBaroboBridge.requestComplete.connect(
    function (token, error, result) {
        if (callbacks[token]) {
            callbacks[token](error, result);
            delete callbacks[token];
        }
    }
);

// Dongle events of the same value may occur consecutively (i.e., two
// dongleDowns in a row), so track the state and only perform actions on state
// changes.
var dongleEventFilter = (function () {
    var lastStatus = null;
    return function (status, data) {
        if (!lastStatus || lastStatus !== status) {
            lastStatus = status;
            manager.event.trigger(status, data);
        }
    };
})();

// This function might be better inside the AsyncLinkbot object? Unsure.
function showRobotUpdateButton (explanation, bot) {
    bot.status = "update";
    bot.event.trigger('changed');
    window.console.log(explanation);
}

// True if the error object e represents a particular error, given the error's
// category and code in string form.
function errorEq(e, category, code) {
    return e.category === category
        && e.code === enumConstants.ErrorCategories[category][code];
}

asyncBaroboBridge.dongleEvent.connect(
    function (error, firmwareVersion) {
        if (error.code == 0) {
            var version = Version.fromTriplet(firmwareVersion);
            if (version.eq(latestLocalFirmwareVersion)) {
                window.console.log('Dongle firmware version ', firmwareVersion);
                dongleEventFilter('dongleUp');
            }
            else {
                dongleEventFilter('dongleUpdate', "The dongle's firmware must be updated.");
            }
        } else {
            if (errorEq(error, 'baromesh', 'STRANGE_DONGLE')) {
                dongleEventFilter('dongleUpdate', "A dongle is plugged in, but we are unable "
                    + "to communicate with it. "
                    + "You may need to update its firmware.");
            }
            else if (errorEq(error, 'baromesh', 'INCOMPATIBLE_FIRMWARE')) {
                dongleEventFilter('dongleUpdate', "The dongle's firmware must be updated.");
            }
            else {
                dongleEventFilter('dongleDown');
                window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
            }
        }
    }
);

asyncBaroboBridge.robotEvent.connect(
    function(error, id, firmwareVersion) {
        console.log('robot event triggered with ID: ' + id + ' and version: ', firmwareVersion);
        var robot = manager.getRobot(id);
        if (robot) {
            if (error.code == 0) {
                var version = Version.fromTriplet(firmwareVersion);
                robot.version = version;
                if (version.eq(latestLocalFirmwareVersion)) {
                    robot.connect();
                }
                else {
                    showRobotUpdateButton(id + "'s firmware must be updated.", robot);
                }
            }
            else if (errorEq(error, 'baromesh', 'INCOMPATIBLE_FIRMWARE')) {
                showRobotUpdateButton(id + "'s firmware must be updated.", robot);
            }
            else {
                window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
            }
        }
    }
);

asyncBaroboBridge.buttonEvent.connect(
    function(id, buttonNumber, eventType, timestamp) {
        // TODO implement this.
        if (buttonEventCallbacks.hasOwnProperty(id)) {
            var objs = buttonEventCallbacks[id];
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                if (obj.buttonId == buttonNumber && eventType == 1) {
                    obj.callback(obj.robot, obj.data, {button: buttonNumber, timestamp: timestamp});
                }
            }
        }
    }
);
asyncBaroboBridge.encoderEvent.connect(
    function(id, jointNumber, anglePosition, timestamp) {
        if (encoderEventCallbacks.hasOwnProperty(id)) {
            var objs = encoderEventCallbacks[id];
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                if (obj.wheelId == jointNumber) {
                    var diff = anglePosition - obj.robot._wheelPositions[jointNumber-1];
                    obj.robot._wheelPositions[jointNumber-1] = anglePosition;
                    obj.callback(obj.robot, obj.data, {triggerWheel: jointNumber, position: anglePosition, difference:diff, timestamp: timestamp});
                }
            }
        }
    }
);
asyncBaroboBridge.jointEvent.connect(
    function(id, jointNumber, eventType, timestamp) {
        var objs = jointEventCallbacks[id];
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            obj.callback(obj.robot, obj.data, {jointNumber: jointNumber, eventType: eventType, timestamp: timestamp});
        }
    }
);
asyncBaroboBridge.accelerometerEvent.connect(
    function(id, x, y, z, timestamp) {
        if (accelerometerEventCallbacks.hasOwnProperty(id)) {
            var objs = accelerometerEventCallbacks[id];
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                obj.callback(obj.robot, obj.data, {x: x, y: y, z: z, timestamp: timestamp});
            }
        }
    }
);

asyncBaroboBridge.acquire.connect(
    function() {
        var acquisition = manager.acquire(1);
        var id = acquisition.robots.length > 0 ? acquisition.robots[0].id : "";
        asyncBaroboBridge.fulfillAcquire(id);
    }
);

asyncBaroboBridge.relinquish.connect(
    function(id) {
        manager.relinquish(manager.getRobot(id));
    }
);

function rgbToHex(value) {
    if (!value || value === null || value === "undefined") {
        return "00";
    }
    var val = Math.round(value);
    val = val.toString(16);
    if (val.length < 2) {
        val = "0" + val;
    }
    return val;
}

function sign(value) {
    return (value > 0) - (value < 0);
}

function colorToHex(color) {
    var red = rgbToHex(color.red);
    var green = rgbToHex(color.green);
    var blue = rgbToHex(color.blue);
    return red + green + blue;
}

module.exports.startFirmwareUpdate = function() {
    asyncBaroboBridge.firmwareUpdate();
};

module.exports.AsyncLinkbot = function AsyncLinkbot(_id) {
    var bot = this;
    var statuses = {0:"offline", 1:"ready", 2:"acquired", 3:"update"};
    var status = 0;
    var id = _id;
    var wheelRadius = 1.75;
    var joinDirection = [0, 0, 0];
    var driveToValue = null;
    var driveToCalled = false;
    var version = null;
    
    bot.enums = enumConstants;
    bot.latestLocalFirmwareVersion = latestLocalFirmwareVersion;

    function driveToCallback(error) {
        driveToCalled = false;
        if (error.code !== 0) {
            // TODO add error handling code here.
            window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
        } else {
            if (driveToValue !== null) {
                bot.driveTo(driveToValue[0], driveToValue[1], driveToValue[2]);
                driveToValue = null;
            }
        }
    }
    
    function checkVersions(error, data) {
        if (0 === error.code) {
            var version = Version.fromTriplet(data);
            var robot = manager.getRobot(id);
            robot.version = version;
            window.console.log('checking version: ' + version);
            if (version.eq(latestLocalFirmwareVersion)) {
                window.console.log('Using firmware version: ' + version + ' for bot: ' + id);
            }
            else {
                showRobotUpdateButton(id + "'s firmware must be updated.", robot);
            }
        } else {
            window.console.warn('error occurred checking firmware version [' + error.category + '] :: ' + error.message);
        }
    }
    
    bot._wheelPositions = [0, 0, 0];
    // Public
    bot.__defineGetter__("_wheelRadius", function(){
        return wheelRadius;
    });
    bot.__defineSetter__("_wheelRadius", function(value){
        wheelRadius = value;
        bot.event.trigger('changed');
    });
    bot.__defineGetter__("status", function(){
        return statuses[status];
    });
    bot.__defineSetter__("version", function(value) {
        version = value;
    });
    bot.__defineGetter__("version", function() {
        return version;
    });
    bot.__defineSetter__("status", function(val) {
        if (val === "ready") {
            status = 1;
        } else if (val === "offline") {
            status = 0;
        } else if (val === "acquired") {
            status = 2;
        } else if (val === "update") {
            status = 3;
        }
        bot.event.trigger('changed');
    });
    bot.__defineGetter__("id", function() {
        return id;
    });
    // For Backwards compatibility.
    bot.__defineGetter__("_id", function() {
        return id;
    });
    
    bot.getColor = function(callback) {
        asyncBaroboBridge.getLedColor(id, addCallback(function(error, data) {
            if (0 == error.code) {
                callback(data);
            } else {
                callback({red:96,green:96,blue:96});
            }
        }));
    };
    bot.getHexColor = function(callback) {
        asyncBaroboBridge.getLedColor(id, addCallback(function(error, data) {
            if (0 == error.code) {
                callback(colorToHex(data));
            } else {
                callback('606060');
            }
        }));
        
    };
    bot.color = function(r, g, b) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.setLedColor(id, token, r, g, b);
            bot.event.trigger('changed');
        }
    };
    bot.angularSpeed = function(s1, s2, s3) {
        if (s2 === null) {
            s2 = s1;
        }
        if (s3 === null) {
            s3 = s1;
        }
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.setJointSpeeds(id, token, 7, s1, s2, s3);
        }
    };

    bot.move = function(r1, r2, r3) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.move(id, token, 7, r1, r2, r3);
        }
    };

    bot.moveTo = function(r1, r2, r3) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveTo(id, token, 7, r1, r2, r3);
        }
    };

    bot.moveToOneMotor = function(joint, position) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            var mask = 0;
            if (joint === 0) {
                mask = 1;
            } else if (joint === 1) {
                mask = 2;
            } else if (joint === 2) {
                mask = 4;
            }
            asyncBaroboBridge.moveTo(id, token, mask, position, position, position);
        }
    };

    bot.drive = function(r1, r2, r3) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.drive(id, token, 7, r1, r2, r3);
        }
    };

    bot.driveTo = function(r1, r2, r3) {
        if (status != 0 && status != 3) {
            if (driveToCalled) {
                driveToValue = [r1, r2, r3];
            } else {
                driveToCalled = true;
                var token = addCallback(driveToCallback);
                asyncBaroboBridge.driveTo(id, token, 7, r1, r2, r3);
            }
        }
    };

    bot.moveForward = function() {
        joinDirection[0] = 1;
        joinDirection[2] = -1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveBackward = function() {
        joinDirection[0] = -1;
        joinDirection[2] = 1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveLeft = function() {
        joinDirection[0] = -1;
        joinDirection[2] = -1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveRight = function() {
        joinDirection[0] = 1;
        joinDirection[2] = 1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveJointContinuous = function(joint, direction) {
        var token, mask = 0;
        if (joint >= 0 && joint <= 2) {
            if (direction > 0) {
                joinDirection[joint] = 1;
            } else if (direction < 0) {
                joinDirection[joint] = -1;
            } else {
                joinDirection[joint] = 0;
                // Special call for stopping so it relaxes the motor.
                token = addGenericCallback();
                asyncBaroboBridge.stop(id, token, (1 << joint));
                return true;
            }
            if (status != 0 && status != 3) {
                token = addGenericCallback();
                if (joint === 0) {
                    mask = 1;
                } else if (joint === 1) {
                    mask = 2;
                } else if (joint === 2) {
                    mask = 4;
                }
                asyncBaroboBridge.moveContinuous(id, token, mask, joinDirection[0], joinDirection[1], joinDirection[2]);
            }
            return true;
        }
        return false;
    };
    bot.wheelPositions = function(callback) {
        if (status != 0 && status != 3) {
            var token = addCallback(function(error, data) {
                if (error.code == 0) {
                    callback(data);
                    
                } else {
                    callback({values:[0, 0, 0], timestamp:-1});
                }
            });
            asyncBaroboBridge.getJointAngles (id, token);
        }
    };

    bot.getJointSpeeds = function(callback) {
        if (status != 0 && status != 3) {
            var token = addCallback(function(error, data) {
                if (error.code == 0) {
                    callback(data);
                } else {
                    window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
                }
            });
            asyncBaroboBridge.getJointSpeeds(id, token);
        }
    };

    bot.stop = function() {
        joinDirection[0] = 0;
        joinDirection[2] = 0;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.stop(id, token);
        }
    };

    bot.buzzerFrequency = function(freq) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.setBuzzerFrequency(id, token, freq);
        }
    };

    bot.zero = function() {
      if (asyncBaroboBridge.resetEncoderRevs) {
          var token = addCallback(function(error) {
              if (error.code !== 0) {
                  // TODO add error handling code here.
                  window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
              } else {
                  bot.moveTo(0, 0, 0);
              }

          });
          asyncBaroboBridge.resetEncoderRevs(id, token);
      } else {
          bot.moveTo(0, 0, 0);
      }
    };

    bot.getFormFactor = function(callback) {
        if (status != 0 && status != 3  && callback) {
            var token = addCallback(function(error, data) {
                if (error.code == 0) {
                    callback(data);
                } else {
                    window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
                }
            });
            asyncBaroboBridge.getFormFactor(id, token);
        }
    };

    bot.disconnect = function() {
        bot.stop();
        bot.unregister();

        var token = addGenericCallback();
        asyncBaroboBridge.disconnectRobot(id, token);

        bot.status = "offline";
        return id;
    };

    bot.connect = function(callback) {
        var token;
        if (status == 0) {
            asyncBaroboBridge.connectRobot(id, addCallback(function(error) {
                if (0 == error.code) {
                    // If a TCP tunnel is currently active for this robot, it starts
                    // acquired.
                    bot.status = asyncBaroboBridge.isTunnelActive(id)
                                 ? "acquired" : "ready";
                    bot.event.trigger('changed');
                    asyncBaroboBridge.getVersions(id, addCallback(checkVersions));
                }
                else if (errorEq(error, 'rpc', 'DECODING_FAILURE')
                         || errorEq(error, 'rpc', 'PROTOCOL_ERROR')
                         || errorEq(error, 'rpc', 'INTERFACE_ERROR')) {
                    showRobotUpdateButton("We are unable to communicate with " + id
                        + ". It may need a firmware update.", bot);
                }
                else if (errorEq(error, 'rpc', 'VERSION_MISMATCH')) {
                    showRobotUpdateButton(id + "'s firmware must be updated.", bot);
                }
                else {
                    window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
                }
                if (callback) {
                    callback(error);
                }
            }));
        } else {
            token = addCallback(function(error) {
                if (0 != error.code) {
                    status = 0;
                    bot.event.trigger('changed');
                } else {
                    window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
                }
                if (callback) {
                    callback(error);
                }
            });
            asyncBaroboBridge.getLedColor(id, token);
        }
    };
    // This is a deprecated method.
    bot.register = function(connections) {
        var obj, token;
        if (status == 0 || status == 3 || typeof(connections) == 'undefined') {
            return;
        }
        if (connections.hasOwnProperty('button')) {
            buttonEventCallbacks.hasOwnProperty(id) || (buttonEventCallbacks[id] = []);
            for (var buttonId in connections.button) {
                if (connections.button.hasOwnProperty(buttonId)) {
                    obj = connections.button[buttonId];
                    buttonEventCallbacks[id].push({
                        robot: bot,
                        buttonId: buttonId,
                        callback: obj.callback,
                        data: obj.data
                    });
                }
            }
            if (buttonEventCallbacks[id].length > 0) {
                token = addGenericCallback();
                asyncBaroboBridge.enableButtonEvents (id, token, true);
            }
        }
        if (connections.hasOwnProperty('wheel')) {
            var granularity = 5.0;
            encoderEventCallbacks.hasOwnProperty(id) || (encoderEventCallbacks[id] = []);
            for (var wheelId in connections.wheel) {
                if (connections.wheel.hasOwnProperty(wheelId)) {
                    obj = connections.wheel[wheelId];
                    encoderEventCallbacks[id].push({
                        robot: bot,
                        wheelId: wheelId,
                        callback: obj.callback,
                        data: obj.data
                    });
                    if (obj.hasOwnProperty('distance') && obj.distance < granularity) {
                        granularity = obj.distance;
                    }
                }
            }
            if (encoderEventCallbacks[id].length > 0) {
                token = addGenericCallback();
                asyncBaroboBridge.enableEncoderEvents(id, token, granularity, true);
            }
        }
        if (connections.hasOwnProperty('joint')) {
            obj = connections.joint;
            jointEventCallbacks.hasOwnProperty(id) || (jointEventCallbacks[id] = []);
            jointEventCallbacks[id].push({robot:bot, callback:obj.callback, data:obj.data});
            token = addGenericCallback();
            asyncBaroboBridge.enableJointEvents(id, token, true);
        }
        if (connections.hasOwnProperty('accel')) {
            obj = connections.accel;
            accelerometerEventCallbacks.hasOwnProperty(id) || (accelerometerEventCallbacks[id] = []);
            accelerometerEventCallbacks[id].push({robot:bot, callback:obj.callback, data:obj.data});
            token = addGenericCallback();
            asyncBaroboBridge.enableAccelerometerEvents(id, token, true);
        }
    };
    // This is a deprecated method.
    bot.unregister = function() {
        var token;
        if (buttonEventCallbacks.hasOwnProperty(id) && buttonEventCallbacks[id].length > 0) {
            token = addGenericCallback();
            asyncBaroboBridge.enableButtonEvents (id, token, false);
        }
        if (encoderEventCallbacks.hasOwnProperty(id) && encoderEventCallbacks[id].length > 0) {
            token = addGenericCallback();
            asyncBaroboBridge.enableEncoderEvents(id, token, 5.0, false);
        }
        if (accelerometerEventCallbacks.hasOwnProperty(id) && accelerometerEventCallbacks[id].length > 0) {
            token = addGenericCallback();
            asyncBaroboBridge.enableAccelerometerEvents(id, token, false);
        }
        if (jointEventCallbacks.hasOwnProperty(id) && jointEventCallbacks[id].length > 0) {
            token = addGenericCallback();
            asyncBaroboBridge.enableJointEvents(id, token, false);
        }
    };
    bot.event = eventlib.Events.extend({});
    /**
     * Deprecated Button Constants.
     * Used when registering button callbacks.
     */
    bot.BUTTON_POWER = bot.enums.Button.POWER;
    bot.BUTTON_A = bot.enums.Button.A;
    bot.BUTTON_B = bot.enums.Button.B;
};
