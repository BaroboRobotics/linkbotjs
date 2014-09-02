function RobotManager(document) {
    var manager = this;
    var events = {'dragstart': [], 'dragover': [], 'drop': [], 'add': [], 'remove': []};


    // Private
    function dragStart(e) {
      var evt = events.dragstart;
      for (var i = 0; i < evt.length; i++) {
        evt[i](e);
      }
    }

    function dragOver(e) {
      var evt = events.dragover;
      for (var i = 0; i < evt.length; i++) {
        evt[i](e);
      }
    }

    function drop(e) {
      var evt = events.drop;
      for (var i = 0; i < evt.length; i++) {
        evt[i](e);
      }
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
      container = document.querySelector('.robomgr-container');
      left = /robomgr-left/.test(spanBtn.className);
      if (left) {
        spanBtn.className = 'robomgr-pulloutbtn robomgr-right';
        container.className = 'robomgr-container robomgr-container-hidden';
      } else {
        spanBtn.className = 'robomgr-pulloutbtn robomgr-left';
        container.className = 'robomgr-container robomgr-container-open';
      }
      return e;
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
      var li, rm;
      li = doc.createElement('li');
      rm = doc.createElement('span');
      rm.innerText = '[-]';
      rm.setAttribute('class', "robomgr--rmBtn robomgr--hoverItem");
      rm.addEventListener('click', function(e) { _uiRemoveFn(e, r.id); });
      li.setAttribute('draggable', 'true');
      li.setAttribute('class', "robomgr--" + r.status);
      li.setAttribute('id', 'robomgr-id-' + r.id);
      li.innerText = r.id;
      li.appendChild(rm);
      li.addEventListener('dragstart', dragStart);
      li.addEventListener('dragover', dragOver);
      li.addEventListener('drop', drop);
      li.addEventListener('mouseover', function(e) {
        e.stopPropagation();
        if (e.currentTarget === li) {
          return e.currentTarget.classList.add("robomgr--roboHover");
        }
      });
      li.addEventListener('mouseout', function(e) {
        e.stopPropagation();
        if (e.currentTarget === li) {
          return e.currentTarget.classList.remove("robomgr--roboHover");
        }
      });
      return li;
    }

    function _constructElement(doc) {
      var addBtn, el, pulloutBtn;
      el = doc.createElement('div');
      el.setAttribute('class', 'robomgr-container robomgr-container-hidden');
      el.innerHTML = '<div class="robomgr-pullout">' + '<span class="robomgr-pulloutbtn robomgr-right"></span>' + '</div>' + '<form>' + '<div id="robotFormContainer">' + '<label for="robotInput" id="robotInputLabel" class="sr-only">Linkbot ID</label>' + '<input name="robotInput" id="robotInput" type="text" placeholder="Linkbot ID" />' + '<button id="robomgr-add">Add</button>' + '</div>' + '</form><ol></ol>';
      addBtn = el.querySelector('button');
      pulloutBtn = el.querySelector('.robomgr-pullout');
      addBtn.addEventListener('click', _uiAdd);
      pulloutBtn.addEventListener('click', _uiMenuSlide);
      return el;
    }

    // Public
    this.robots = new RobotStatus();
    this.element = _constructElement(document);


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
      var robotList = manager.robots.list();
      for (var i = 0; i < robotList.length; i++) {
        var r = robotList[i];
        ol.appendChild(_robotLi(doc, r));
      }
      manager.element.replaceChild(ol, manager.element.querySelector('ol'));
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