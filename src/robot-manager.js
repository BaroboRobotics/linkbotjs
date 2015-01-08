function RobotManager(document) {
    // Private
    var manager = this;
    var events = {
        'add': [],
        'remove': [],
        'moved': []
    };
    var _controlPanelRobot = null;
    var _robotStatusInterval = null;

    function _ledChanged(id, red, green, blue) {
        manager.redraw();
    }

    function _checkRobotStatus() {
        var robotList, color, r, i, bot, redraw;
        redraw = false;
        robotList = manager.robots.list();
        for (i = 0; i < robotList.length; i++) {
            r = robotList[i];
            if (r.linkbot) {
                color = r.linkbot.getColor();
                if (color.red === 0 && color.green === 0 && color.blue === 0) {
                    // then possibly offline and need to reconnect.
                    redraw = true;
                    bot = new Linkbot(r.id);
                    if (bot._id !== null) {
                        manager.robots.ready(i, bot);
                        bot.register({
                            led: {
                                callback: _ledChanged
                            }
                        });
                    } else {
                        manager.robots.fail(i);
                    }
                }
            } else {
                // Attempt to connect to robot.
                bot = new Linkbot(r.id);
                if (bot._id !== null) {
                    manager.robots.ready(i, bot);
                    bot.register({
                        led: {
                            callback: _ledChanged
                        }
                    });
                    redraw = true;
                } else {
                    manager.robots.fail(i);
                }
            }
        }
        if (redraw === true) {
            manager.redraw();
        }
    }

    function controlZeroPressed() {
        _controlPanelRobot.linkbot.moveTo(0, 0, 0);
    }

    function controlBeepClicked() {
        var val = LinkbotControls.slider.getValue('buzzer-frequency-id');
        _controlPanelRobot.linkbot.buzzerFrequency(val);
        setTimeout(function() { _controlPanelRobot.linkbot.buzzerFrequency(0); }, 250);
    }

    function controlBeepDown() {
        var val = LinkbotControls.slider.getValue('buzzer-frequency-id');
        _controlPanelRobot.linkbot.buzzerFrequency(val);
    }

    function controlBeepUp() {
        _controlPanelRobot.linkbot.buzzerFrequency(0);
    }

    function controlSpeedChanged(value) {
        var j1, j2;
        j1 = LinkbotControls.slider.getValue('speed-joint-1');
        j2 = LinkbotControls.slider.getValue('speed-joint-2');
        _controlPanelRobot.linkbot.angularSpeed(j1, 0, j2);
    }

    function controlKnobChanged(value) {
        var j1, j2;
        j1 = LinkbotControls.knob.getInternalValue('position-joint-1');
        j2 = LinkbotControls.knob.getInternalValue('position-joint-2');
        _controlPanelRobot.linkbot.moveTo(j1, 0, j2);
    }

    function controlAccelChanged(robot, data, event) {
        LinkbotControls.slider.get('accel-xaxis').setValue(event.x);
        LinkbotControls.slider.get('accel-yaxis').setValue(event.y);
        LinkbotControls.slider.get('accel-zaxis').setValue(event.z);
        var mag = Math.sqrt((event.x * event.x)  + (event.y * event.y) + (event.z * event.z));
        LinkbotControls.slider.get('accel-mag').setValue(mag);
    }

    function showControlPanel(e, r) {
        if (r.status == 'failed') {
            // TODO add error message here.
            return;
        }
        // Show control panel.
        var contrlEl = document.getElementById('robomgr-control-panel');
        contrlEl.className = '';
        var overlay = document.getElementById('robomgr-overlay');
        overlay.className = '';
        var linkbotName = document.getElementById('robomgr-control-panel-linkbot');
        if (document.body.className.indexOf('noscroll') == -1) {
            document.body.className += ' noscroll';
        }
        linkbotName.innerText = 'Linkbot ' + r.id;
        // Set tabs correctly.
        document.getElementById('robomgr-tab-control-panel').className = '';
        document.getElementById('robomgr-tab-sensors-panel').className = 'robomgr-hide';
        document.getElementById('robomgr-tab-control').parentElement.className='robomgr-active';
        document.getElementById('robomgr-tab-sensors').parentElement.className='';
        if (_controlPanelRobot && _controlPanelRobot !== null) {
            _controlPanelRobot.linkbot.unregister(false);
        }
        _controlPanelRobot = r;
        _controlPanelRobot.linkbot.angularSpeed(50, 0, 50);
        LinkbotControls.slider.get('speed-joint-1').setValue(50);
        LinkbotControls.slider.get('speed-joint-2').setValue(50);
        LinkbotControls.slider.get('buzzer-frequency-id').setValue(440);
        pos = _controlPanelRobot.linkbot.wheelPositions();
        if (pos) {
            LinkbotControls.knob.get('position-joint-1').setValue(pos[0]);
            LinkbotControls.knob.get('position-joint-2').setValue(pos[3]);
        }
        var regObj = {
            accel: {
                callback: controlAccelChanged
            },
            wheel: {
                0: {
                    distance: 1,
                    callback: function(robot, data, event) {
                        LinkbotControls.knob.get('position-joint-1').setValueWithoutChange(event.position);
                    }
                },
                2: {
                    distance: 1,
                    callback: function(robot, data, event) {
                        LinkbotControls.knob.get('position-joint-2').setValueWithoutChange(event.position);
                    }
                }
            },
            button: { }
        };
        regObj.button[_controlPanelRobot.linkbot.BUTTON_POWER] = {
            callback: function() {
                console.log(event);
            }
        };
        regObj.button[_controlPanelRobot.linkbot.BUTTON_A] = {
            callback: function() {
                console.log(event);
            }
        };
        regObj.button[_controlPanelRobot.linkbot.BUTTON_B] = {
            callback: function() {
                console.log(event);
            }
        };
        _controlPanelRobot.linkbot.register(regObj);

    }

    function hideControlPanel() {
        // Dismiss Control panel.
        var controlPanel = document.getElementById('robomgr-control-panel');
        var overlay = document.getElementById('robomgr-overlay');
        controlPanel.setAttribute('class', 'robomgr-hide');
        overlay.setAttribute('class', 'robomgr-hide');
        var data = document.body.className;
        if (data) {
            document.body.className = '';
            data = data.split(" ");
            for (i = 0; i < data.length; i++) {
                if (data[i] != 'noscroll') {
                    document.body.className += ' ' + data[i];
                }
            }
        }
        _controlPanelRobot.linkbot.unregister(false);
        _controlPanelRobot = null;
        _uiMenuSlide();
    }

    function _hexToRgb(hex) {
        var bigint;
        if (hex.substr(0, 1) === '#') {
            bigint = parseInt(hex.substring(1), 16);
        } else {
            bigint = parseInt(hex, 16);
        }
        return {
            'red':((bigint >> 16) & 255),
            'green':((bigint >> 8) & 255),
            'blue':(bigint & 255)
        };
    }

    function _rgbToHex(value) {
        if (!value || value === null || value === "undefined") {
            return "00";
        }
        var val = Math.round(value);
        val = val.toString(16);
        if (val.length < 2) {
            val = "0" + val;
        }
        return val;
    }

    function _colorToHex(color) {
        var red = _rgbToHex(color.red);
        var green = _rgbToHex(color.green);
        var blue = _rgbToHex(color.blue);
        return red + green + blue;
    }

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
            if (destination == source) {
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
        if (idInput.value && idInput.value.length == 4) {
            manager.add(idInput.value.toUpperCase());
            idInput.value = "";
            manager.connect();
            manager.redraw();
        }
    }

    function _closeMenuSlide(e) {
        var spanBtn = manager.element.querySelector('span');
        var left = /robomgr-left/.test(spanBtn.className);
        if (!left) {
            return;
        }
        _uiMenuSlide(e);
    }

    function _openMenuSlide(e) {
        var spanBtn = manager.element.querySelector('span');
        var left = /robomgr-left/.test(spanBtn.className);
        if (left) {
            return;
        }
        _uiMenuSlide(e);
    }

    function _uiMenuSlide(e) {
        var container, left, spanBtn, overlay, i, color;
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        spanBtn = manager.element.querySelector('span');
        container = document.querySelector('#robomgr-container');
        left = /robomgr-left/.test(spanBtn.className);

        if (left) {
            var slideElements = document.getElementsByClassName('robomgr-slide-element');
            for (i = 0; i < slideElements.length; i++) {
                slideElements[i].className = 'robomgr-slide-element robomgr-slide-element-left';
            }
            spanBtn.className = 'robomgr-pulloutbtn robomgr-right';
            container.className = 'robomgr-container-hidden';
            document.body.style.marginLeft = '';
            //clearInterval(_robotStatusInterval);
            _robotStatusInterval = null;
        } else {
            spanBtn.className = 'robomgr-pulloutbtn robomgr-left';
            container.className = 'robomgr-container-open';
            document.body.style.marginLeft = '300px';
           // _checkRobotStatus();
            //_robotStatusInterval = setInterval(_checkRobotStatus, 3000);
        }
        return e;
    }

    function _uiSlideOut(e, r) {
        var slideElements, divElement, right, i;
        divElement = e.target;
        if (!/robomgr-slide-element/.test(divElement.className)) {
            return;
        }
        right = /robomgr-slide-element-right/.test(divElement.className);
        if (right) {
            divElement.className = 'robomgr-slide-element robomgr-slide-element-left';
            hideControlPanel();
        } else {
            slideElements = document.getElementsByClassName('robomgr-slide-element');
            for (i = 0; i < slideElements.length; i++) {
                slideElements[i].className = 'robomgr-slide-element robomgr-slide-element-left';
            }
            divElement.className = 'robomgr-slide-element robomgr-slide-element-right';
            showControlPanel(e, r);
        }
        e.stopPropagation();
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
        var li, div, trash, beep, color, colorSpan, colorVal;
        li = doc.createElement('li');
        div = doc.createElement('div');
        color = doc.createElement('input');
        color.type = "color";
        color.className = 'robomgr-color-btn';
        colorSpan = doc.createElement('span');
        colorSpan.className = 'robomgr-color-btn-title';
        colorSpan.innerText = 'color';
        trash = doc.createElement('span');
        trash.setAttribute('class', "robomgr-remove-btn");
        trash.innerText = 'trash';
        beep = doc.createElement('span');
        beep.setAttribute('class', 'robomgr-beep-btn');
        beep.innerText = 'beep';
        li.setAttribute('draggable', 'true');
        li.setAttribute('class', "robomgr--" + r.status);
        li.setAttribute('id', 'robomgr-id-' + r.id);
        if (r && r.linkbot) {
            colorVal = "#" + _colorToHex(r.linkbot.getColor());
            li.style.background = colorVal;
            color.value = colorVal;
        } else {
            color.value = '#606060';
            li.style.background = "#606060";
        }
        li.appendChild(color);
        li.appendChild(colorSpan);
        li.appendChild(beep);
        li.appendChild(trash);
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
        div.addEventListener('click', function(e) {
            _uiSlideOut(e, r);
        }, true);
        trash.addEventListener('click', function(e) {
            _uiRemoveFn(e, r.id);
        });
        beep.addEventListener('click', function(e) {
            if (r.status !== 'failed' ) {
                r.linkbot.buzzerFrequency(500);
                setTimeout(function() { r.linkbot.buzzerFrequency(0); }, 250);
            }
        });
        color.addEventListener('input', function (e) {
            if (r && r.linkbot) {
                var value = _hexToRgb(color.value);
                r.linkbot.color(value.red, value.green, value.blue);
            } else {
                color.value = '#606060';
            }
        });
        return li;
    }

    function _constructTopNav(doc) {
        var el = doc.createElement('div');
        el.setAttribute('id', 'robomgr-top-navigation');
        var htmlVal = ['',
            '<h1 class="robomgr-logo"><a href="/index.html">Linkbot Labs</a></h1>',
            '<div class="robomgr-top-nav-info">',
            ' <p id="ljs-top-nav-breadcrumbs" class="robomgr-top-nav-breadcrumbs">&nbsp;</p>',
            ' <h1 id="ljs-top-nav-title" class="robomgr-top-nav-title">&nbsp;</h1>',
            '</div>'
        ].join('');
        el.innerHTML = htmlVal;
        return el;
    }

    function _constructElement(doc) {
        var addBtn, el, controlPanel, overlay, pulloutBtn, btn;
        el = doc.createElement('div');

        overlay = doc.createElement('div');
        overlay.setAttribute('id', 'robomgr-overlay');
        overlay.setAttribute('class', 'robomgr-hide');
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

        controlPanel = doc.createElement('div');
        controlPanel.setAttribute('class', 'robomgr-hide');
        controlPanel.setAttribute('id', 'robomgr-control-panel');
        var controlPanelHtml = ['',
            '<div class="robomgr-control-nav">',
            ' <div class="robomgr-control-img">close</div>',
            ' <div class="robomgr-control-title">',
            '   <h1 id="robomgr-control-panel-linkbot">Linkbot</h1>',
            '   <span>control panel</span>',
            ' </div>',
            '</div>',
            '<div>',
            ' <ul class="robomgr-tabs">',
            '   <li class="robomgr-active"><a id="robomgr-tab-control">control</a></li>',
            '   <li><a id="robomgr-tab-sensors">sensors</a></li>',
            ' </ul>',
            '</div>',
            '<div id="robomgr-tab-control-panel">',
            ' <div class="robomgr-row">',
            '   <div class="robomgr-control-col">position',
            '     <div class="robomgr-control-poster" style="padding: 10px;">',
            '       <div style="float: left;">',
            '         <input type="text" class="linkbotjs-knob" id="position-joint-1" /> <p style="margin:0;">Joint 1</p>',
            '       </div>',
            '       <div style="margin-left: 125px; width: 125px;">',
            '         <input type="text" class="linkbotjs-knob" id="position-joint-2" /> <p style="margin:0;">Joint 2</p>',
            '       </div>',
            '     </div>',
            '   </div>',
            '   <div class="robomgr-control-col">',
            '     joint control',
            '     <div class="robomgr-control-poster">',
            '       <div style="display: inline-table;">',
            '         <button id="robomgr-joint1-up" class="robomgr-btn-up joint-control-btn">joint 1 up</button>',
            '         <button id="robomgr-joint1-stop" class="robomgr-btn-stop joint-control-btn">joint 1 stop</button>',
            '         <button id="robomgr-joint1-down" class="robomgr-btn-down joint-control-btn">joint 1 down</button>',
            '         joint1',
            '       </div>',
            '       <div style="display: inline-table;">',
            '         <button id="robomgr-joint2-up" class="robomgr-btn-up joint-control-btn">joint 2 up</button>',
            '         <button id="robomgr-joint2-stop" class="robomgr-btn-stop joint-control-btn">joint 2 stop</button>',
            '         <button id="robomgr-joint2-down" class="robomgr-btn-down joint-control-btn">joint 2 down</button>',
            '         joint2',
            '       </div>',
            '     </div>',
            '   </div>',
            ' </div>',
            ' <div class="robomgr-row">',
            '   <div class="robomgr-control-col">',
            '     drive control',
            '     <div class="robomgr-control-poster">',
            '       <div><button id="robomgr-drive-up" class="drive-control-btn-sm robomgr-btn-up">up</button></div>',
            '       <div>',
            '         <button id="robomgr-drive-left" class="drive-control-btn-sm robomgr-btn-left">left</button>',
            '         <button id="robomgr-drive-down" class="drive-control-btn-sm robomgr-btn-down">down</button>',
            '         <button id="robomgr-drive-right" class="drive-control-btn-sm robomgr-btn-right">right</button>',
            '       </div>',
            '       <div><button id="robomgr-drive-zero" class="drive-control-btn-lg robomgr-btn-zero">zero</button></div>',
            '       <div><button id="robomgr-drive-stop" class="drive-control-btn-lg robomgr-btn-stop">stop</button></div>',
            '     </div>',
            '   </div>',
            '   <div class="robomgr-control-col">speed',
            '     <div class="robomgr-control-poster" style="padding: 10px;">',
            '       <div style="float: left; width: 110px;">',
            '         <div id="speed-joint-1" class="linkbotjs-slider" data-min="10" data-max="200"></div> <p style="padding-top: 10px;">Joint 1: <span id="speed-joint-1-value">10</span></p>',
            '       </div>',
            '       <div style="margin-left: 132px; width: 110px;">',
            '         <div id="speed-joint-2" class="linkbotjs-slider" data-min="10" data-max="200"></div> <p style="padding-top: 10px;">Joint 2: <span id="speed-joint-2-value">10</span></p>',
            '       </div>',
            '     </div>',
            '     <!-- acceleration',
            '     <div class="robomgr-control-poster" style="padding: 10px;">',
            '       <div style="float: left; width: 110px;">',
            '         <div id="acceleration-joint-1" class="linkbotjs-slider" data-min="10" data-max="200"></div> <p style="padding-top: 10px;">Joint 1: <span id="acceleration-joint-1-value">10</span></p>',
            '       </div>',
            '       <div style="margin-left: 132px; width: 110px;">',
            '         <div id="acceleration-joint-2" class="linkbotjs-slider" data-min="10" data-max="200"></div> <p style="padding-top: 10px;">Joint 2: <span id="acceleration-joint-2-value">10</span></p>',
            '       </div>',
            '     </div> -->',
            '   </div>',
            ' </div>',
            ' <div class="robomgr-row">',
            '   <div class="robomgr-control-col" style="visibility: hidden;"></div>',
            ' </div>',
            '</div>',
            '<div id="robomgr-tab-sensors-panel" class="robomgr-hide">',
            ' <div class="robomgr-row" style="text-align: center;">buzzer control',
            '     <div class="robomgr-control-poster" style="padding: 10px 30px;">',
            '     <div>',
            '       <div style="float: left; width: 300px;">',
            '         <span>buzzer frequency (hz):</span> <span id="buzzer-frequency-id-value">440</span>',
            '         <div id="buzzer-frequency-id" class="linkbotjs-slider" data-min="130" data-max="1000"></div>',
            '       </div>',
            '       <div style="width: 100px; margin-left: 305px;">',
            '         <span id="buzzer-frequency-button" class="robomgr-beep-btn">beep</span>',
            '       </div>',
            '     </div>',
            '   </div>',
            ' </div>',
            ' <div class="robomgr-row" style="text-align: center;">accelerometer',
            '   <div class="robomgr-control-poster" style="height: 275px; padding: 20px;">',
            '     <div style="float: left; width: 140px; height: 100%;"><div id="accel-xaxis" style="height: 90%; margin: 0 auto;" class="linkbotjs-vslider" data-type="float" data-min="-5" data-max="5"></div><p style="padding-top: 10px;">x axis: <span id="accel-xaxis-value">0</span></p></div>',
            '     <div style="float: left; width: 140px; height: 100%;"><div id="accel-yaxis" style="height: 90%; margin: 0 auto;" class="linkbotjs-vslider" data-type="float" data-min="-5" data-max="5"></div><p style="padding-top: 10px;">y axis: <span id="accel-yaxis-value">0</span></p></div>',
            '     <div style="float: left; width: 140px; height: 100%;"><div id="accel-zaxis" style="height: 90%; margin: 0 auto;" class="linkbotjs-vslider" data-type="float" data-min="-5" data-max="5"></div><p style="padding-top: 10px;">z axis: <span id="accel-zaxis-value">0</span></p></div>',
            '     <div style="width: 130px; margin-left: 420px; height: 100%;"><div id="accel-mag" style="height: 90%; margin: 0 auto;" class="linkbotjs-vslider" data-type="float" data-min="0" data-max="5"></div><p style="padding-top: 10px;">mag: <span id="accel-mag-value">0</span></p></div>',
            '   </div>',
            ' </div>',
            '</div>'
        ].join('');
        controlPanel.innerHTML = controlPanelHtml;
        // Order matters.
        el.appendChild(overlay);
        el.appendChild(controlPanel);
        overlay.addEventListener('click', hideControlPanel);
        controlPanel.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        var imgElements = controlPanel.getElementsByClassName('robomgr-control-img');
        imgElements[0].addEventListener('click', function(e) {
            hideControlPanel();
        });
        // Enable controls.
        var i;
        var knobElements = controlPanel.getElementsByClassName('linkbotjs-knob');
        for (i = 0; i < knobElements.length; i++) {
            LinkbotControls.knob.add(knobElements[i]);
        }
        var sliderElements = controlPanel.getElementsByClassName('linkbotjs-slider');
        for (i = 0; i < sliderElements.length; i++) {
            LinkbotControls.slider.add(sliderElements[i]);
        }
        var vsliderElements = controlPanel.getElementsByClassName('linkbotjs-vslider');
        for (i = 0; i < vsliderElements.length; i++) {
            LinkbotControls.slider.add(vsliderElements[i]);
        }
        //Add event handling:
        LinkbotControls.slider.addChangeCallback('speed-joint-1', function(value) {
            document.getElementById('speed-joint-1-value').innerText = value;
            controlSpeedChanged(value);
        });
        LinkbotControls.slider.addChangeCallback('speed-joint-2', function(value) {
            document.getElementById('speed-joint-2-value').innerText = value;
            controlSpeedChanged(value);
        });
        /*
        LinkbotControls.slider.addChangeCallback('acceleration-joint-1', function(value) {
            document.getElementById('acceleration-joint-1-value').innerText = value;
        });
        LinkbotControls.slider.addChangeCallback('acceleration-joint-2', function(value) {
            document.getElementById('acceleration-joint-2-value').innerText = value;
        });
        */
        LinkbotControls.slider.addChangeCallback('buzzer-frequency-id', function(value) {
            document.getElementById('buzzer-frequency-id-value').innerText = value;
        });
        LinkbotControls.slider.addChangeCallback('accel-xaxis', function(value) {
            document.getElementById('accel-xaxis-value').innerText = Math.round(value * 10000) / 10000;
        });
        LinkbotControls.slider.addChangeCallback('accel-yaxis', function(value) {
            document.getElementById('accel-yaxis-value').innerText = Math.round(value * 10000) / 10000;
        });
        LinkbotControls.slider.addChangeCallback('accel-zaxis', function(value) {
            document.getElementById('accel-zaxis-value').innerText = Math.round(value * 10000) / 10000;
        });
        LinkbotControls.slider.addChangeCallback('accel-mag', function(value) {
            document.getElementById('accel-mag-value').innerText = Math.round(value * 10000) / 10000;
        });
        LinkbotControls.knob.addChangeCallback('position-joint-1', controlKnobChanged);
        LinkbotControls.knob.addChangeCallback('position-joint-2', controlKnobChanged);
        var tabs = controlPanel.getElementsByTagName('a');
        /* jshint ignore:start */
        for (i in tabs) {
            if (tabs[i].id == 'robomgr-tab-control') {
                tabs[i].addEventListener('click', function(e) {
                    document.getElementById('robomgr-tab-control-panel').className = '';
                    document.getElementById('robomgr-tab-sensors-panel').className = 'robomgr-hide';
                    document.getElementById('robomgr-tab-control').parentElement.className='robomgr-active';
                    document.getElementById('robomgr-tab-sensors').parentElement.className='';
                    e.stopPropagation();
                });
            } else if (tabs[i].id == 'robomgr-tab-sensors') {
                tabs[i].addEventListener('click', function(e) {
                    document.getElementById('robomgr-tab-control-panel').className = 'robomgr-hide';
                    document.getElementById('robomgr-tab-sensors-panel').className = '';
                    document.getElementById('robomgr-tab-control').parentElement.className='';
                    document.getElementById('robomgr-tab-sensors').parentElement.className='robomgr-active';
                    e.stopPropagation();
                });
            }
        }
        var beepBtns = controlPanel.getElementsByClassName('robomgr-beep-btn');
        i = 0;
        for (i in beepBtns) {
            var beepBtn = beepBtns[i];
            if (beepBtn && beepBtn.addEventListener) {
                beepBtn.addEventListener('onmousedown', controlBeepDown);
                beepBtn.addEventListener('onmouseup', controlBeepUp);
                beepBtn.addEventListener('click', controlBeepClicked);
            }
        }
        var buttons = controlPanel.getElementsByTagName('button');
        for (i in buttons) {
            btn = buttons[i];
            if (btn && btn.id) {
                if (btn.id === 'robomgr-drive-stop') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.stop();
                    });
                } else if (btn.id == 'robomgr-joint1-stop') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveJointContinuous(0, 0);
                    });
                } else if (btn.id == 'robomgr-joint2-stop') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveJointContinuous(2, 0);
                    });
                } else if (btn.id == 'robomgr-drive-zero') {
                    btn.addEventListener('click', controlZeroPressed);
                }
            }
        }
        var ctrl_buttons = controlPanel.getElementsByTagName('button');
        for (i = 0; i < ctrl_buttons.length; i++) {
            btn = ctrl_buttons[i];
            if (btn.id) {
                if (btn.id === 'robomgr-drive-up') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveForward();
                    });
                } else if (btn.id === 'robomgr-drive-down') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveBackward();
                    });
                } else if (btn.id === 'robomgr-drive-left') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveLeft();
                    });
                } else if (btn.id === 'robomgr-drive-right') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveRight();
                    });
                } else if (btn.id === 'robomgr-joint1-up') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveJointContinuous(0, 1);
                    });
                } else if (btn.id === 'robomgr-joint1-down') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveJointContinuous(0, -1);
                    });
                } else if (btn.id === 'robomgr-joint2-up') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveJointContinuous(2, -1);
                    });
                } else if (btn.id === 'robomgr-joint2-down') {
                    btn.addEventListener('click', function() {
                        _controlPanelRobot.linkbot.moveJointContinuous(2, 1);
                    });
                }
            }
        }
        /* jshint ignore:end */
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
                    bot.register({
                      led: {
                        callback: _ledChanged
                      }
                    });
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

    this.selectedControlPanelRobot = function() {
      return _controlPanelRobot;
    };

    this.openMenu = function() {
        _openMenuSlide();
    };

    this.closeMenu = function() {
        _closeMenuSlide();
    };
}
