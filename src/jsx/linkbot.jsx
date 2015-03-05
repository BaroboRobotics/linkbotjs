"use strict";

var eventlib = require('./event.jsx');
var manager = require('./manager.jsx');


var firmwareVersions = asyncBaroboBridge.availableFirmwareVersions();
var enumConstants = asyncBaroboBridge.enumerationConstants();
var requestId = 0;
var callbacks = {};
var buttonEventCallbacks = {};
var encoderEventCallbacks = {};
var accelerometerEventCallbacks = {};

function addCallback(id, func) {
    var token = requestId++;
    callbacks.hasOwnProperty(id) || (callbacks[id] = {});
    callbacks[id][token] = func;
    return token;
}

function genericCallback(error) {
    if (error.code !== 0) {
        // TODO add error handling code here.
        window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
    }
}

asyncBaroboBridge.requestComplete.connect(
    function (id, token, error, result) {
        callbacks[id][token](error, result);
        delete callbacks[id][token];
    }
);
asyncBaroboBridge.dongleEvent.connect(
    function (error) {
        if (error.code == 0) {
            manager.event.trigger('dongleUp');
        } else {
            manager.event.trigger('dongleDown');
            window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
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
        // TODO implement this.
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

try {
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
}
catch (e) {
    console.log("No support for C++ robot acquisition, feature disabled. Reason: " + e);
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
    var statuses = {0:"offline", 1:"ready", 2:"acquired"};
    var status = 0;
    var id = _id;
    var wheelRadius = 1.75;
    var joinDirection = [0, 0, 0];
    var driveToValue = null;
    var driveToCalled = false;
    
    bot.enums = enumConstants;
    bot.firmwareVerions = firmwareVersions;

    function driveToCallback(error) {
        driveToCalled = false;
        if (error.code !== 0) {
            // TODO add error handling code here.
            window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
        } else {
            if (driveToValue !== null) {
                bot.driveTo(driveToValue[0], driveToValue[1], driveToValue[2]);
            }
            
        }
    }
    
    function checkVersions(error, data) {
        if (0 === error.code) {
            var valid = false, i = 0, version = "0.0.0";
            version = 'v' + data.major + '.' + data.minor + '.' + data.patch;
            window.console.log('checking version: ' + version);
            for (i = 0; i < firmwareVersions.length; i++) {
                if (version === firmwareVersions[i]) {
                    window.console.log('Using firmware version: ' + version + ' for bot: ' + id);
                    valid = true;
                    break;
                }
            }
            if (!valid && window.location.pathname != '/LinkbotUpdateApp/html/index.html') {
                document.location = "http://zrg6.linkbotlabs.com/LinkbotUpdateApp/html/index.html?badRobot=" + encodeURIComponent(id);
            }
        } else {
            window.console.warn('error occurred checking firmware version [' + error.category + '] :: ' + error.message);
        }
    }
    
    asyncBaroboBridge.connectRobot(id, addCallback(id, function(error) {
        if (0 == error.code) {
            // If a TCP tunnel is currently active for this robot, it starts
            // acquired.
            try {
                status = asyncBaroboBridge.isTunnelActive(id) ? 2 : 1;
            }
            catch (e) {
                status = 1;
            }
            bot.event.trigger('changed');
            asyncBaroboBridge.getVersions(id, addCallback(id, checkVersions));
        } else {
            window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
        }
    }));
    
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
    bot.__defineSetter__("status", function(val) {
        if (val === "ready") {
            status = 1;
        } else if (val === "offline") {
            status = 0;
        } else if (val === "acquired") {
            status = 2;
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
        asyncBaroboBridge.getLedColor(id, addCallback(id, function(error, data) {
            if (0 == error.code) {
                callback(data);
            } else {
                callback({red:96,green:96,blue:96});
            }
        }));
    };
    bot.getHexColor = function(callback) {
        asyncBaroboBridge.getLedColor(id, addCallback(id, function(error, data) {
            if (0 == error.code) {
                callback(colorToHex(data));
            } else {
                callback('606060');
            }
        }));
        
    };
    bot.color = function(r, g, b) {
        if (status != 0) {
            var token = addCallback(id, genericCallback);
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
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.setJointSpeeds(id, token, 7, s1, s2, s3);
        }
    };

    bot.move = function(r1, r2, r3) {
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.move(id, token, 7, r1, r2, r3);
        }
    };

    bot.moveTo = function(r1, r2, r3) {
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.moveTo(id, token, 7, r1, r2, r3);
        }
    };

    bot.drive = function(r1, r2, r3) {
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.drive(id, token, 7, r1, r2, r3);
        }
    };

    bot.driveTo = function(r1, r2, r3) {
        if (status != 0) {
            if (driveToCalled) {
                driveToValue = [r1, r2, r3];
            } else {
                driveToCalled = true;
                var token = addCallback(id, driveToCallback);
                asyncBaroboBridge.driveTo(id, token, 7, r1, r2, r3);
            }
        }
    };

    bot.moveForward = function() {
        joinDirection[0] = 1;
        joinDirection[2] = -1;
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveBackward = function() {
        joinDirection[0] = -1;
        joinDirection[2] = 1;
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveLeft = function() {
        joinDirection[0] = -1;
        joinDirection[2] = -1;
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveRight = function() {
        joinDirection[0] = 1;
        joinDirection[2] = 1;
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
        }
    };
    bot.moveJointContinuous = function(joint, direction) {
        var token;
        if (joint >= 0 && joint <= 2) {
            if (direction > 0) {
                joinDirection[joint] = 1;
            } else if (direction < 0) {
                joinDirection[joint] = -1;
            } else {
                joinDirection[joint] = 0;
                // Special call for stopping so it relaxes the motor.
                token = addCallback(id, genericCallback);
                asyncBaroboBridge.stop(id, token, (1 << joint));
                return true;
            }
            if (status != 0) {
                token = addCallback(id, genericCallback);
                asyncBaroboBridge.moveContinuous(id, token, 7, joinDirection[0], joinDirection[1], joinDirection[2]);
            }
            return true;
        }
        return false;
    };
    bot.wheelPositions = function(callback) {
        if (status != 0) {
            var token = addCallback(id, function(error, data) {
                if (error.code == 0) {
                    callback(data);
                    
                } else {
                    callback({values:[0, 0, 0], timestamp:-1});
                }
            });
            asyncBaroboBridge.getJointAngles (id, token);
        }
    };

    bot.stop = function() {
        joinDirection[0] = 0;
        joinDirection[2] = 0;
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.stop(id, token);
        }
    };

    bot.buzzerFrequency = function(freq) {
        if (status != 0) {
            var token = addCallback(id, genericCallback);
            asyncBaroboBridge.setBuzzerFrequency(id, token, freq);
        }
    };

    bot.disconnect = function() {
        bot.stop();
        bot.unregister();

        var token = addCallback(id, genericCallback);
        asyncBaroboBridge.disconnectRobot(id, token);

        bot.status = "offline";
        return id;
    };

    bot.connect = function() {
        var token;
        if (status == 0) {
            token = addCallback(id, function(error) {
                if (0 == error.code) {
                    status = 1;
                    bot.event.trigger('changed');
                } else {
                    window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
                }
            });
            asyncBaroboBridge.connectRobot(id, token);
        } else {
            token = addCallback(id, function(error) {
                if (0 != error.code) {
                    status = 0;
                    bot.event.trigger('changed');
                } else {
                    window.console.warn('error occurred [' + error.category + '] :: ' + error.message);
                }
            });
            asyncBaroboBridge.getLedColor(id, token);
        }
    };
    // This is a deprecated method.
    bot.register = function(connections) {
        var obj, token;
        if (status == 0 || typeof(connections) == 'undefined') {
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
                token = addCallback(id, genericCallback);
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
                token = addCallback(id, genericCallback);
                asyncBaroboBridge.enableEncoderEvents(id, token, granularity, true);
            }
        }
        if (connections.hasOwnProperty('accel')) {
            obj = connections.accel;
            accelerometerEventCallbacks.hasOwnProperty(id) || (accelerometerEventCallbacks[id] = []);
            accelerometerEventCallbacks[id].push({robot:bot, callback:obj.callback, data:obj.data});
            token = addCallback(id, genericCallback);
            asyncBaroboBridge.enableAccelerometerEvents(id, token, true);
        }
    };
    // This is a deprecated method.
    bot.unregister = function() {
        var token;
        if (buttonEventCallbacks.hasOwnProperty(id) && buttonEventCallbacks[id].length > 0) {
            token = addCallback(id, genericCallback);
            asyncBaroboBridge.enableButtonEvents (id, token, false);
        }
        if (encoderEventCallbacks.hasOwnProperty(id) && encoderEventCallbacks[id].length > 0) {
            token = addCallback(id, genericCallback);
            asyncBaroboBridge.enableEncoderEvents(id, token, 5.0, false);
        }
        if (accelerometerEventCallbacks.hasOwnProperty(id) && accelerometerEventCallbacks[id].length > 0) {
            token = addCallback(id, genericCallback);
            asyncBaroboBridge.enableAccelerometerEvents(id, token, false);
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
