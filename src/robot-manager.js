function RobotManager(document) {
    var manager = this;
    var events = {
        'add': [],
        'remove': [],
        'moved': []
    };

    // Private
    function findRobomgrId(element) {
        if (element) {
            var id = element.getAttribute('id');
            if (id && /^robomgr\-id\-/.test(id)) {
                return element;
            }
            return findRobomgrId(element.parentElement);
        }
        return null;
    }

    function dragStart(e) {
        var id = e.target.getAttribute('id');
        if (id && /^robomgr\-id\-/.test(id)) {
            e.dataTransfer.setData('text/html', e.target.innerHTML);
            e.dataTransfer.effectAllowed = 'move';
            source = e.target;
        }
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
            var destination = findRobomgrId(e.target);
            if (!destination || destination === null) {
                return true;
            }
            var srcId = source.getAttribute('id').replace(/robomgr-id-/, '');
            var destId = destination.getAttribute('id').replace(/robomgr-id-/, '');
            var olElement = destination.parentElement;
            if (destination == olElement.lastChild) {
              olElement.removeChild(source);
              olElement.insertBefore(source, null);
            } else if (destination == source.nextSibling) {
              olElement.removeChild(source);
              olElement.insertBefore(source, destination.nextSibling);
            } else {
              olElement.removeChild(source);
              olElement.insertBefore(source, destination);
            }
            // Moved Event Callback.
            var evt = events.moved;
            for (var i = 0; i < evt.length; i++) {
                evt[i](srcId, destId);
            }
            return false;
        }
        return true;
    }

    function _uiAdd(e) {
        var idInput;
        e.preventDefault();
        idInput = manager.element.querySelector('input#robotInput');
        manager.add(idInput.value);
        idInput.value = "";
        manager.connect();
        manager.redraw();
    }

    function _uiMenuSlide(e) {
        var container, left, spanBtn;
        e.preventDefault();
        spanBtn = manager.element.querySelector('span');
        container = document.querySelector('#robomgr-container');
        left = /robomgr-left/.test(spanBtn.className);
        if (left) {
            spanBtn.className = 'robomgr-pulloutbtn robomgr-right';
            container.className = 'robomgr-container-hidden';
        } else {
            spanBtn.className = 'robomgr-pulloutbtn robomgr-left';
            container.className = 'robomgr-container-open';
        }
        return e;
    }

    function _uiSlideOut(e) {
        var divElement = e.target;
        if (!/robomgr-slide-element/.test(divElement.className)) {
            return;
        }
        var right = /robomgr-slide-element-right/.test(divElement.className);
        if (right) {
            divElement.className = 'robomgr-slide-element robomgr-slide-element-left';
        } else {
            divElement.className = 'robomgr-slide-element robomgr-slide-element-right';
        }
    }

    function _uiRemoveFn(e, id) {
        e.preventDefault();
        manager.robots.remove(id);
        var evt = events.remove;
        for (var i = 0; i < evt.length; i++) {
            evt[i](id);
        }
        manager.redraw();
    }

    function _robotLi(doc, r) {
        var li = doc.createElement('li');
        var div = doc.createElement('div');
        var rm = doc.createElement('span');
        rm.setAttribute('class', "robomgr-remove-btn");
        rm.innerText = 'Trash';
        var beep = doc.createElement('span');
        beep.setAttribute('class', 'robomgr-beep-btn');
        beep.innerText = 'Beep';
        li.setAttribute('draggable', 'true');
        li.setAttribute('class', "robomgr--" + r.status);
        li.setAttribute('id', 'robomgr-id-' + r.id);
        li.appendChild(beep);
        li.appendChild(rm);
        div.setAttribute('class', 'robomgr-slide-element robomgr-slide-element-left');
        var htmlVal = ['',
            '<span id="robot-id-' + r.id + '-name" class="robomgr-robot-name">Linkbot ' + r.id + '</span><br/>',
            '<span id="robot-id-' + r.id + '-status" class="robomgr-robot-status">' + ((r.status == 'failed') ? 'offline' : r.status)  + '</span>'
        ].join('');
        div.innerHTML = htmlVal;
        li.appendChild(div);
        // Add event Listeners.
        li.addEventListener('dragstart', dragStart);
        li.addEventListener('dragover', dragOver);
        li.addEventListener('drop', drop);
        div.addEventListener('click', _uiSlideOut);
        rm.addEventListener('click', function(e) {
            _uiRemoveFn(e, r.id);
        });
        beep.addEventListener('click', function(e) {
          if (r.status !== 'failed' ) {
            r.linkbot.buzzerFrequency(500);
            setTimeout(function() { r.linkbot.buzzerFrequency(0); }, 250);
          }
        });
        
        return li;
    }

    function _constructTopNav(doc) {
        var el = doc.createElement('div');
        el.setAttribute('id', 'robomgr-top-navigation');
        var htmlVal = ['',
            '<h1 class="robomgr-logo">Linkbot Labs</h1>',
            '<div class="robomgr-top-nav-info">',
            ' <p class="robomgr-top-nav-breadcrumbs">Lessons // Algebra 1 // Chapter 1</p>',
            ' <h1 class="robomgr-top-nav-title">Example Lesson 1</h1>',
            '</div>'
        ].join('');
        el.innerHTML = htmlVal;
        return el;
    }

    function _constructElement(doc) {
        var addBtn, el, pulloutBtn;
        el = doc.createElement('div');
        el.setAttribute('class', 'robomgr-container-hidden');
        el.setAttribute('id', 'robomgr-container');
        var htmlVal = ['',
            '<div class="robomgr-pullout">',
            '  <span class="robomgr-pulloutbtn robomgr-right"></span>',
            '</div>',
            '<div id="robomgr-container-content">',
            '  <form>',
            '    <div id="robotFormContainer">',
            '      <label for="robotInput" id="robotInputLabel" class="sr-only">Linkbot ID</label>',
            '      <input name="robotInput" id="robotInput" type="text" placeholder="Linkbot ID" />',
            '      <button id="robomgr-add">Add</button>',
            '    </div>',
            '  </form><ol id="robomgr-robot-list"></ol>',
            '</div>'
        ].join('');
        el.innerHTML = htmlVal;
        addBtn = el.querySelector('button');
        pulloutBtn = el.querySelector('.robomgr-pullout');
        addBtn.addEventListener('click', _uiAdd);
        pulloutBtn.addEventListener('click', _uiMenuSlide);
        return el;
    }

    // Public
    this.robots = new RobotStatus();
    this.element = _constructElement(document);
    this.topNav = _constructTopNav(document);

    this.acquire = function(n) {
        var x = manager.robots.acquire(n);
        manager.redraw();
        return x;
    };

    this.relinquish = function(l) {
        l.disconnect();
        manager.robots.relinquish(l);
        manager.redraw();
    };

    this.add = function() {
        var ids = (1 <= arguments.length) ? [].slice.call(arguments, 0) : [];
        var evt = events.add;
        ids.map(function(i) {
            manager.robots.add(i);
            for (var j = 0; j < evt.length; j++) {
                evt[j](i);
            }
        });
    };

    this.redraw = function() {
        var doc = manager.element.ownerDocument;
        var ol = doc.createElement('ol');
        ol.setAttribute('id', 'robomgr-robot-list');
        var robotList = manager.robots.list();
        for (var i = 0; i < robotList.length; i++) {
            var r = robotList[i];
            ol.appendChild(_robotLi(doc, r));
        }
        var robotListElement = manager.element.querySelector('ol#robomgr-robot-list');
        robotListElement.parentElement.replaceChild(ol, robotListElement);
    };

    this.connect = function() {
        var robotList = manager.robots.list();
        var results = [];
        for (var i = 0; i < robotList.length; i++) {
            var r = robotList[i];
            if (r.status === "new") {
                bot = new Linkbot(r.id);
                if (bot._id !== null) {
                    results.push(manager.robots.ready(i, bot));
                } else {
                    results.push(manager.robots.fail(i));
                }
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    this.registerEvent = function(type, func) {
        var evt = events[type];
        if (evt) {
            evt.push(func);
        }
    };

    this.unregisterEvent = function(type, func) {
        var evt = events[type];
        if (evt) {
            evt.pop(func);
        }
    };

}
