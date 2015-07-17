"use strict";

// If a string begins with 'v' and ends with a dotted sequence of numbers,
// return an array of those numbers. Otherwise, return null.
// Examples:
// 'v1'     -> [ 1 ]
// 'v1.2'   -> [ 1, 2 ]
// 'v1.2.3' -> [ 1, 2, 3 ]
// '1.2.3'  -> null
function parseVersion (v) {
    function parseDecInt (a) {
        return parseInt(a, 10);
    }

    var result = /^v(\d+(?:\.\d+)*)$/.exec(v);
    return result
           ? result[1].split('.').map(parseDecInt)
           : null;
}

// The inverse operation of parseVersion: given an array of numbers, return a
// string beginning with 'v' and ending with the sequence of numbers in dotted
// format.
function generateVersion (v) {
    // Force numbers to be integers with |0 so we don't end up with floating
    // points in the version string. Perhaps paranoid?
    v.map(function(a) { return a | 0; });
    return 'v' + v.reduce(function (p, v) {
        return p.toString() + '.' + v;
    });
}

// Compare two arrays of numbers lexicographically. Return less than zero if a
// is ordered before b, greater than zero if b is ordered before a, and zero if
// the two arguments compare equal. If one array is a prefix of the other, the
// shorter of the two arrays is ordered before the longer. Suitable for use
// with Array.sort().
function lexicographicCompare (a, b) {
    for (var i = 0; i < Math.max(a.length, b.length); ++i) {
        if (a[i] != b[i]) {
            return undefined === a[i] || a[i] < b[i]
                   ? -1 : 1;
        }
    }
    return 0;
}

// Given an array of strings representing versions, choose the maximum version.
// Ignore any strings which cannot be parsed as a version.
function maxVersion (versionList) {
    function chooseGreaterVersion (p, v) {
        return lexicographicCompare(p, v) > 0 ? p : v;
    }

    var versionArrays = versionList.map(parseVersion).filter(Boolean);
    return versionArrays.length
           ? generateVersion(versionArrays.reduce(chooseGreaterVersion))
           : null;
}



// Split a filename into its stem and extension, if present. The extension's
// dot is retained to distinguish no extension from an empty extension.
// Examples:
// 'a.b.c' -> { stem: 'a.b', extension: '.c' }
// 'a.'    -> { stem: 'a',   extension: '.' }
// 'a'     -> { stem: 'a',   extension: null }
function splitFilename (a) {
    var i = a.lastIndexOf('.');
    return i > 0
           ? { stem: a.slice(0, i), extension: a.slice(i) }
           : { stem: a.slice(0),    extension: null };
}

// Generate a list of valid firmware versions available for installation on the
// user's Linkbots, given a list of firmware files. A list like [ 'v4.4.6.hex',
// 'v4.4.5.hex' 'v4.4.5.eeprom'] would result in [ 'v4.4.5' ].
function filesToVersions (firmwareFiles) {
    // First, take a roll call of all .eeprom and .hex files.
    var fws = {};
    firmwareFiles.map(splitFilename)
                 .forEach(function (file) {
        if (!file.stem in fws) {
            fws[file.stem] = 0;
        }
        fws[file.stem] |= Number(file.extension === '.hex');
        fws[file.stem] |= Number(file.extension === '.eeprom') << 1;
    });

    // Firmware which are valid are those which have both a .hex file and a
    // .eeprom file.
    var validFws = [];
    for (var fwVersion in fws) {
        if (fws.hasOwnProperty(fwVersion)) {
            if (fws[fwVersion] == 3) {
                validFws.push(fwVersion);
            }
        }
    }

    return validFws;
}



module.exports.maxVersion = maxVersion;
module.exports.filesToVersions = filesToVersions;
