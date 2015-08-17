"use strict";

var Version = require('./version.jsx');

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
function fileListToVersionList (firmwareFiles) {
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
    // .eeprom file, and their version string is representable by Version.
    var validFws = [];
    for (var fwVersion in fws) {
        if (fws.hasOwnProperty(fwVersion)) {
            var v = Version.fromString(fwVersion);
            if (v && fws[fwVersion] == 3) {
                validFws.push(v);
            }
        }
    }

    return validFws;
}


module.exports.fileListToVersionList = fileListToVersionList;
