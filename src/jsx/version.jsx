"use strict";

// A Version object represents a version as an arbitrarily long sequence of
// numbers. Versions can be constructed from strings, from the version objects
// returned by asyncBaroboBridge, or directly from an array of numbers. Some
// comparison functions are also provided.
var Version = function (va) {
    this.versionArray = va;
};

// Construct a Version object from an object returned by asyncBaroboBridge.
// Return null if the argument does not conform to the major, minor, patch
// form.
//   Version.fromTriplet({major: 1, minor: 2, patch: 3})
Version.fromTriplet = function (t) {
    var va = [t.major, t.minor, t.patch];
    return va.every(function (a) { return typeof a !== 'undefined'; })
           ? new Version(va)
           : null;
};

// Construct a Version object from a string containing a number or dotted
// sequence of numbers. Return null if the string does not conform.
//   Version.fromString('1.2.3')
Version.fromString = function (s) {
    function parseDecInt (a) {
        return parseInt(a, 10);
    }
    var result = /^(\d+(?:\.\d+)*)$/.exec(s);
    return result
           ? new Version(result[1].split('.').map(parseDecInt))
           : null;
};

// Return the represented version in dotted number string format.
// new Version([1, 2, 3]).toString() == '1.2.3'
Version.prototype.toString = function () {
    return this.versionArray.map(function (a) {
        // Force numbers to be integers with |0 so we don't end up with
        // floating points in the version string. Perhaps paranoid?
        return (a|0).toString();
    }).reduce(function (p, v) {
        return p + '.' + v;
    });
};

// Compare two arrays of numbers lexicographically.
function lexicographicCompare (a, b) {
    for (var i = 0; i < Math.max(a.length, b.length); ++i) {
        if (a[i] != b[i]) {
            return typeof a[i] === 'undefined' || a[i] < b[i]
                   ? -1 : 1;
        }
    }
    return 0;
}

// Compare two version objects. Return less than zero if a is ordered before b,
// greater than zero if b is ordered before a, and zero if the two versions
// compare equal. If one version is a prefix of the other, the shorter of the
// two versions is ordered before the longer. Suitable for use with
// Array.sort().
Version.cmp = function (a, b) {
    return lexicographicCompare(a.versionArray, b.versionArray);
};

Version.max = function (a, b) {
    return Version.cmp(a, b) > 0 ? a : b;
};

Version.prototype.eq = function (a) {
    return Version.cmp(this, a) === 0;
};

module.exports = Version;
