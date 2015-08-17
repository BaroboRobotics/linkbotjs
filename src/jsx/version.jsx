"use strict";

var Version = function (va) {
    this.versionArray = va;
};

// Construct a Version object from a number or dotted sequence of numbers,
// optionally prepended with a 'v' character.
// Example valid input: '1', '1.2', '1.2.3', 'v1.2.3', etc.
Version.prototype.fromString = function (s) {
    function parseDecInt (a) {
        return parseInt(a, 10);
    }
    var result = /^v?(\d+(?:\.\d+)*)$/.exec(s);
    return result
           ? new Version(result[1].split('.').map(parseDecInt))
           : null;
    }
};

// Return the represented version in dotted-number-string format.
// new Version('1.2.3').toString() == '1.2.3'
Version.prototype.toString = function () {
    return versionArray.map(function (a) {
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
            return undefined === a[i] || a[i] < b[i]
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
Version.prototype.cmp = function (a, b) {
    return lexicographicCompare(a.versionArray, b.versionArray);
};

module.exports = Version;
