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
              var src = manager.robots.robots.splice(srcOrder, 1);
              manager.robots.robots.splice(destOrder, 0, src[0]);
            }
          });
        }
      });
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        e.dataTransfer.effectAllowed = 'move';
        source = e.target;
    }

    function dragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
    }

    function drop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (source != e.target) {
            var srcId = source.getAttribute('id').replace(/robomgr-id-/, '');
            var destId = e.target.getAttribute('id').replace(/robomgr-id-/, '');
            var id = source.getAttribute('id');
            var clazz = source.getAttribute('class');
            source.setAttribute('id', e.target.getAttribute('id'));
            source.setAttribute('class', e.target.getAttribute('class'));
            source.innerHTML = e.target.innerHTML;
            e.target.setAttribute('id', id);
            e.target.setAttribute('class', clazz);
            e.target.innerHTML = e.dataTransfer.getData('text/html');
            move(srcId, destId);
        }
        return false;
    }

    function add(id) {
      storage.add(id, 0);
    }

    function remove(id) {
      storage.remove(id);
    }

    storage.getAll(function(robots) {
      for (var i = 0; i < robots.length; i++) {
        manager.add(robots[i].name);
      }
      manager.connect();
      manager.redraw();
    });

    manager.registerEvent('dragstart', dragStart);
    manager.registerEvent('dragover', dragOver);
    manager.registerEvent('drop', drop);
    manager.registerEvent('add', add);
    manager.registerEvent('remove', remove);  

    exports.scan = function() {
        return baroboBridge.scan();
    };
    exports.managerElement = function() {
        return manager.element;
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
    exports.storage = storage;

    return exports;
})(Linkbots || {}, document);
