"use strict";

var deepEqual = require('deep-equal');

function set (k, v) {
    var config = asyncBaroboBridge.configuration;
    if (!config) {
        config = {};
    }
    config[k] = v;
    asyncBaroboBridge.configuration = config;
    return deepEqual(asyncBaroboBridge.configuration, config);
}

function get (k) {
    var config = asyncBaroboBridge.configuration;
    if (!config) {
        config = {};
    }
    return config[k];
}

module.exports.set = set;
module.exports.get = get;