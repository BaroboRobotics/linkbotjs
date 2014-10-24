var Linkbots = (function(exports, doc) {
    var manager = new RobotManager(doc);
    var storage = new Storage();
    var source = null;

    function move(srcId, destId) {
        storage.getAll(function(robots) {
            srcOrder = -1;
            destOrder = -1;
            for (var i = 0; i < robots.length; i++) {
                if (robots[i].name === srcId) {
                    srcOrder = robots[i].order;
                } else if (robots[i].name === destId) {
                    destOrder = robots[i].order;
                }
                if (destOrder >= 0 && srcOrder >= 0) {
                    break;
                }
            }
            if (destOrder >= 0 && srcOrder >= 0) {
                storage.changePosition(srcOrder, destOrder, function(success) {
                    if (success === true) {
                        // TODO: this should be moved to the robot manager.
                        var src = manager.robots.robots.splice(srcOrder, 1);
                        manager.robots.robots.splice(destOrder, 0, src[0]);
                    }
                });
            }
        });
    }


    function add(id) {
        storage.add(id, 0);
    }

    function remove(id) {
        storage.remove(id, function(success) {
            if (success) {
                storage.updateOrder();
            }
        });
    } 

    storage.getAll(function(robots) {
        for (var i = 0; i < robots.length; i++) {
            manager.add(robots[i].name);
        }
        manager.connect();
        manager.redraw();
    });


    manager.registerEvent('moved', move);
    manager.registerEvent('add', add);
    manager.registerEvent('remove', remove);  

    exports.scan = function() {
        return baroboBridge.scan();
    };
    exports.managerElement = function() {
        return manager.element;
    };
    exports.topNavElement = function() {
        document.body.style.marginTop = "90px";
        manager.element.style.top = "75px";
        return manager.topNav;
    };
    exports.acquire = function(n) {
        return manager.acquire(n);
    };
    exports.relinquish = function(l) {
        return manager.relinquish(l);
    };
    exports.managerAdd = function() {
        var ids = (1 <= arguments.length) ? [].slice.call(arguments, 0) : [];
        return manager.add.apply(manager, ids);
    };
    exports.managerRedraw = function() {
        return manager.redraw();
    };
    exports.managerConnect = function() {
        return manager.connect();
    };
    exports.setNavTitle = function(title) {
        var element = doc.getElementById('ljs-top-nav-title');
        if (element) {
            element.innerText = title;
        }
    };
    exports.setNavCrumbs = function(crumbs) {
        var element = doc.getElementById('ljs-top-nav-breadcrumbs');
        if (element) {
            element.innerText = crumbs.join(" // ");
        }
    };
    exports.storage = storage;

    LinkbotControls.knob.init();
    LinkbotControls.slider.init();

    return exports;
})(Linkbots || {}, document);
