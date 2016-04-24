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
var robotEvents = [];

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
            if (version.eq(firmware.latestVersion())) {
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
                if (version.eq(firmware.latestVersion())) {
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
        robotEvents.forEach(function(event) {
            event(id, 'buttonEvent', buttonNumber, eventType, timestamp);
        });
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
        robotEvents.forEach(function(event) {
            event(id, 'encoderEvent', jointNumber, anglePosition, timestamp);
        });
    }
);
asyncBaroboBridge.jointEvent.connect(
    function(id, jointNumber, eventType, timestamp) {
        var objs = jointEventCallbacks[id];
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            obj.callback(obj.robot, obj.data, {jointNumber: jointNumber, eventType: eventType, timestamp: timestamp});
        }
        robotEvents.forEach(function(event) {
            event(id, 'jointEvent', jointNumber, eventType, timestamp);
        });
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
        robotEvents.forEach(function(event) {
            event(id, 'accelerometerEvent', x, y, z, timestamp);
        });
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

function logError(error) {
    if (console) {
        if (console.error) {
            console.error(error);
        } else if (console.log) {
            console.log(error);
        }
    }
}

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
    firmware.startUpdater();
};
/**
 * Linkbot.
 * @class AsyncLinkbot
 * @param _id {string} The id of the linkbot.
 * @constructor
 * @property _wheelRadius {number} The wheel radius.
 * @property status {string} The status of the linkbot.
 * @property version {string} The firmware version.
 * @property id {string} The robot id.
 */
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
    var events = {};
    robotEvents.push(eventHandler);
    /**
     * Enumeration constants.
     * @type {{Button, ButtonState, FormFactor, JointState}}
     */
    bot.enums = enumConstants;

    function eventHandler(identifier, eventName, a, b, c, d) {
        if (id !== identifier) {
            return;
        }
        if (eventName === 'buttonEvent') {
            buttonEvent(a, b, c);
        }
        if (eventName === 'encoderEvent') {
            encoderEvent(a, b, c);
        }
        if (eventName === 'accelerometerEvent') {
            accelerometerEvent(a, b, c, d);
        }
        if (eventName === 'jointEvent') {
            jointEvent(a, b, c);
        }
    }

    function buttonEvent(button, state, timestamp) {
        var buttonEvents = events['buttonEvent'];
        if (buttonEvents && Array.isArray(buttonEvents)) {
            buttonEvents.forEach(function(event) {
                try {
                    event(button, state, timestamp);
                } catch(err) {
                    logError(err);
                }
            });
        }
    }

    function encoderEvent(encoder, angle, timestamp) {
        var encoderEvents = events['encoderEvent'];
        if (encoderEvents &&  Array.isArray(encoderEvents)) {
            encoderEvents.forEach(function(event) {
                try {
                    event(encoder, angle, timestamp);
                } catch(err) {
                    logError(err);
                }
            });
        }
    }

    function accelerometerEvent(x, y, z, timestamp) {
        var accelerometerEvents = events['accelerometerEvent'];
        if (accelerometerEvents && Array.isArray(accelerometerEvents)) {
            accelerometerEvents.forEach(function(event) {
                try {
                    event(x, y, z, timestamp);
                } catch(err) {
                    logError(err);
                }
            });
        }
    }

    function jointEvent(joint, state, timestamp) {
        var jointEvents = events['jointEvent'];
        if (jointEvents && Array.isArray(jointEvents)) {
            jointEvents.forEach(function(event) {
                try {
                    event(joint, state, timestamp);
                } catch (err) {
                    logError(err);
                }
            });
        }
    }

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
            if (version.eq(firmware.latestVersion())) {
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
    /**
     * Color value.
     * @typedef ColorType
     * @property {number} red Value between 0 to 255 representing the red color value.
     * @property {number} green Value between 0 to 255 representing the red color value.
     * @property {number} blue Value between 0 to 255 representing the red color value.
     */

    /**
     * Color Callback.
     *
     * @callback robotColorCallback
     * @param {ColorType} color The color values.
     */

    /**
     * Returns the robot LED color in a callback.
     * @function getColor
     * @memberOf AsyncLinkbot
     * @param {robotColorCallback} callback The color callback.
     * @instance
     */
    bot.getColor = function(callback) {
        asyncBaroboBridge.getLedColor(id, addCallback(function(error, data) {
            if (0 == error.code) {
                callback(data);
            } else {
                callback({red:96,green:96,blue:96});
            }
        }));
    };
    /**
     * Hex Color Callback.
     * @callback robotHexColorCallback
     * @param {string} hexColor A hex string representing the LED color value.
     */

    /**
     * Returns the robot LED color in a callback.
     * @function getHexColor
     * @memberOf AsyncLinkbot
     * @param {robotHexColorCallback} callback The color callback.
     * @instance
     */
    bot.getHexColor = function(callback) {
        asyncBaroboBridge.getLedColor(id, addCallback(function(error, data) {
            if (0 == error.code) {
                callback(colorToHex(data));
            } else {
                callback('606060');
            }
        }));
        
    };
    /**
     * Sets the robots LED value.
     * @function color
     * @memberOf AsyncLinkbot
     * @param r {number} The red value between 0 and 255.
     * @param g {number} The green value between 0 and 255.
     * @param b {number} The blue value between 0 and 255.
     * @instance
     */
    bot.color = function(r, g, b) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.setLedColor(id, token, r, g, b);
            bot.event.trigger('changed');
        }
    };
    /**
     * Sets the motor angular speed.
     * @function angularSpeed
     * @memberOf AsyncLinkbot
     * @param s1 {number} The angular speed value for motor 1.
     * @param s2 {number} The angular speed value for motor 2.
     * @param s3 {number} The angular speed value for motor 3.
     * @instance
     */
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
    /**
     * Runs the motors the specified number of degrees.  Positive values move
     * the wheel clockwise.
     * @function move
     * @memberOf AsyncLinkbot
     * @param r1 {number} value to move motor 1 to.
     * @param r2 {number} value to move motor 2 to.
     * @param r3 {number} value to move motor 3 to.
     * @instance
     */
    bot.move = function(r1, r2, r3) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.move(id, token, 7, r1, r2, r3);
        }
    };
    /**
     * Moves the motors to a particular absolute position. The Linkbot has an
     * internal sense of zero that it uses for this method.
     * @function moveTo
     * @memberOf AsyncLinkbot
     * @param r1 {number} value to move motor 1 to.
     * @param r2 {number} value to move motor 2 to.
     * @param r3 {number} value to move motor 3 to.
     * @instance
     */
    bot.moveTo = function(r1, r2, r3) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveTo(id, token, 7, r1, r2, r3);
        }
    };
    /**
     * Moves a single motor to a particular absolute position.
     * @function moveToOneMotor
     * @see AsyncLinkbot.moveTo
     * @memberOf AsyncLinkbot
     * @param joint {number} The motor joint to move (0, 1, or 2).
     * @param position {number} The position to move the motor to.
     * @instance
     */
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
    /**
     * Drives the motors the specified number of degrees.  Positive values move
     * the wheel clockwise.
     * @function drive
     * @memberOf AsyncLinkbot
     * @param r1 {number} value to drive motor 1 to.
     * @param r2 {number} value to drive motor 2 to.
     * @param r3 {number} value to drive motor 3 to.
     * @instance
     */
    bot.drive = function(r1, r2, r3) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.drive(id, token, 7, r1, r2, r3);
        }
    };
    /**
     * Drives the motors to a particular absolute position. The Linkbot has an
     * internal sense of zero that it uses for this method.
     * @function driveTo
     * @memberOf AsyncLinkbot
     * @param r1 {number} value to drive motor 1 to.
     * @param r2 {number} value to drive motor 2 to.
     * @param r3 {number} value to drive motor 3 to.
     * @instance
     */
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
    /**
     * Moves an I-Linkbot in the forward direction.
     * @function moveForward
     * @memberOf AsyncLinkbot
     * @instance
     */
    bot.moveForward = function() {
        joinDirection[0] = 1;
        joinDirection[2] = -1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    /**
     * Moves an I-Linkbot in the backwards direction.
     * @function moveBackward
     * @memberOf AsyncLinkbot
     * @instance
     */
    bot.moveBackward = function() {
        joinDirection[0] = -1;
        joinDirection[2] = 1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    /**
     * Moves an I-Linkbot to the left.
     * @function moveBackward
     * @memberOf AsyncLinkbot
     * @instance
     */
    bot.moveLeft = function() {
        joinDirection[0] = -1;
        joinDirection[2] = -1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    /**
     * Moves an I-Linkbot to the right.
     * @function moveBackward
     * @memberOf AsyncLinkbot
     * @instance
     */
    bot.moveRight = function() {
        joinDirection[0] = 1;
        joinDirection[2] = 1;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    /**
     * Moves a Joint continuously in a specific direction.
     * @function moveJointContinuous
     * @memberOf AsyncLinkbot
     * @param joint {number} The robot motor number to move.
     * @param direction {number} (1,0, or -1) Positive numbers move the robot motor in the positive direction, zero stops and -1 moves the motor in the negative direction.
     * @return {boolean} True if the input was valid and sent to the robot.
     * @instance
     */
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
    /**
     * Wheel Positions type.
     * @typedef WheelPositionsType
     * @property {Array.number} values An array containing the wheel positions.
     * @property {number} timestamp A timestamp of when representing the time the wheels were at that position.
     * if there was an error the timestamp will be set to -1.
     */

    /**
     * Wheel Positions Callback.
     * @callback robotWheelPositionsCallback
     * @param {WheelPositionsType} positions The wheel position values.
     */

    /**
     * Call to get the wheel positions of the Linkbot.
     * @function wheelPositions
     * @memberOf AsyncLinkbot
     * @param callback {robotWheelPositionsCallback} A callback that returns the wheel positions.
     * @instance
     */
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
    /**
     * Joint Speeds Callback.
     * @callback robotJointSpeedsCallback
     * @param {Array.number} speeds An array of joint speeds.
     */

    /**
     * Call to get the joint speeds of the Linkbot.
     * @function getJointSpeeds
     * @memberOf AsyncLinkbot
     * @param callback {robotJointSpeedsCallback} The joint speeds returned as a callback.
     * @instance
     */
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

    /**
     * Stops all motors on the robot.
     * @function stop
     * @memberOf AsyncLinkbot
     * @instance
     */
    bot.stop = function() {
        joinDirection[0] = 0;
        joinDirection[2] = 0;
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.stop(id, token);
        }
    };

    /**
     * Sets the buzzer frequency for the robot.  This is how you make it make sounds.
     * @function buzzerFrequency
     * @memberOf AsyncLinkbot
     * @param freq {number} The frequency value.
     * @instance
     */
    bot.buzzerFrequency = function(freq) {
        if (status != 0 && status != 3) {
            var token = addGenericCallback();
            asyncBaroboBridge.setBuzzerFrequency(id, token, freq);
        }
    };

    /**
     * Moves all the Linkbot motors to the zero position.
     * @function zero
     * @memberOf AsyncLinkbot
     * @instance
     */
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
    /**
     * Form Factor Callback.
     * ex.
     * linkbot.getFormFactor(function(data) {
     *       if (linkbot.enums.FormFactor.I == data) {
     *           // The linkbot is an I-Linkbot.
     *       }
     * });
     * @callback robotFormFactorCallback
     * @param {enum} FormFactor the form factor is returned and should be checked against the enums.FormFactor.
     */

    /**
     * Returns the Linkbot form factor.
     * @param callback {robotFormFactorCallback} The form factor as a callback.
     * @instance
     */
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

    /**
     * Disconnects from the Linkbot.  It also calls the stop() and unregister methods before disconnecting.
     * @function disconnect
     * @memberOf AsyncLinkbot
     * @return {string} The Linkbot id.
     * @instance
     */
    bot.disconnect = function() {
        bot.stop();
        bot.unregister();

        var token = addGenericCallback();
        asyncBaroboBridge.disconnectRobot(id, token);

        bot.status = "offline";
        return id;
    };

    /**
     * Connects to a Linkbot.
     * @function connect
     * @memberOf AsyncLinkbot
     * @param callback {Object} the callback is called if there was an error.  The error object is returned.
     * @instance
     */
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
    bot.on = function(eventName, callback) {
        if (eventName === 'jointEvent' || eventName === 'buttonEvent' || eventName === 'accelerometerEvent' || eventName === 'encoderEvent') {
            // Ignore any other event name.
            var callbacks = events[eventName];
            if (callbacks && Array.isArray(callbacks)) {
                callbacks.push(callback);
            } else {
                callbacks = [];
                callbacks.push(callback);
                events[eventName] = callbacks;
                var token = addGenericCallback();
                if (eventName === 'buttonEvent') {
                    asyncBaroboBridge.enableButtonEvents(id, token, true);
                } else if (eventName === 'jointEvent') {
                    asyncBaroboBridge.enableJointEvents(id, token, true);
                } else if (eventName === 'accelerometerEvent') {
                    asyncBaroboBridge.enableAccelerometerEvents(id, token, true);
                } else if (eventName === 'encoderEvent') {
                    asyncBaroboBridge.enableEncoderEvents(id, token, 1, true);
                }
            }
        }
    };
    /**
     * Acceleration connection type.
     * @typedef  AccelConnectionType
     * @property callback {function} The function to be called back for acceleration events.
     * function(robot, data, event) - The data is what you set when you registered.  The event is an object with x, y, z
     * values.
     * @property data {Object} Optional the data you want returned on callback.
     */

    /**
     * Button connection type.
     * @typedef  ButtonConnectionType
     * @property {Object} 0 The button number to register for as an object. See enums for button numbers.
     * ex.
     * {
     *     0: {
     *          callback: function(robot, data, event) { ... }
     *          data: ...
     *        }
     * }
     */

    /**
     * Wheel connection type.
     * @typedef  WheelConnectionType
     * @property {Object} 0 The motor number (starts at zero) to register for as an object.
     * ex.
     * {
     *     0: {
     *          callback: function(robot, data, event) { ... }
     *          data: ...
     *          distance: (this is optional and specifies the granularity).
     *        }
     * }
     */

    /**
     * Joint connection type.
     * @typedef  JointConnectionType
     * @property callback {function} The function to be called back for acceleration events.
     * function(robot, data, event) - The data is what you set when you registered.  The event is an object with x, y, z
     * values.
     * @property data {Object} Optional the data you want returned on callback.
     */

    /**
     * @typedef ConnectionsType
     * @property accel {AccelConnectionType} Optional object that contains accel callback and data.
     * @property button {ButtonConnectionType} Optional object that contains button callback and data.
     * @property wheel {WheelConnectionType} Optional object that contains wheel callback and data.
     * @property joint {JointConnectionType} Option object that contains joint callback and data.
     */

    /**
     * Registers for Linkbot events.
     * @function register
     * @memberOf AsyncLinkbot
     * @param connections {ConnectionsType} an object containing callbacks and data you want to register for.
     * @instance
     */
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
    /**
     * Unregisters from Linkbot events.
     * @function unregister
     * @memberOf AsyncLinkbot
     * @instance
     */
    bot.unregister = function() {
        var token;
        token = addGenericCallback();
        asyncBaroboBridge.enableButtonEvents (id, token, false);
        token = addGenericCallback();
        asyncBaroboBridge.enableEncoderEvents(id, token, 5.0, false);
        token = addGenericCallback();
        asyncBaroboBridge.enableAccelerometerEvents(id, token, false);
        token = addGenericCallback();
        asyncBaroboBridge.enableJointEvents(id, token, false);
        events = {};
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
