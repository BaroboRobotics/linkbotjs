"use strict";
var events = {
    on: function(event, callback, context) {
        this.hasOwnProperty('events') || (this.events = {});
        this.events.hasOwnProperty(event) || (this.events[event] = []);
        this.events[event].push([callback, context]);
    },
    off: function(event, callback, context) {
        this.hasOwnProperty('events') || (this.events = {});
        var i, list, index;
        list = this.events[event] || [];
        index = -1;
        for (i = 0; i < list.length; i++) {
            if (list[i][0] === callback || list[i][1] == context) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    },
    trigger: function(event) {
        this.hasOwnProperty('events') || (this.events = {});
        var args = Array.apply([], arguments);
        var tail = Array.prototype.slice.call(args, 1), callbacks = this.events[event] || [];
        for(var i = 0, l = callbacks.length; i < l; i++) {
            var callback = callbacks[i][0],
                context = callbacks[i][1] === undefined ? this : callbacks[i][1];
            callback.apply(context, tail);
        }
    },
    clearAll: function() {
        this.events = {};
    },
    clearEvent: function(event) {
        this.events[event] = [];
    },
    extend: function(other) {
        for (var property in this) {
            other[property] = this[property];
        }
        return other;
    }
};

module.exports.Events = events;