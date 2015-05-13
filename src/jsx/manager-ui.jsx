"use strict";

var React = require('react');
var manager = require('./manager.jsx');
var eventlib = require('./event.jsx');
var linkbotLib = require('./linkbot.jsx');

var uiEvents = eventlib.Events.extend({});
var rad2deg = 180/Math.PI;
var positions = [0, 0, 0];

function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while(element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }
    return { x: xPosition, y: yPosition };
}

function hexToRgb(hex) {
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

var SliderControl = React.createClass({
    propTypes: {
        hasChanged: React.PropTypes.func,
        max: React.PropTypes.number,
        min: React.PropTypes.number,
        height: React.PropTypes.number,
        width: React.PropTypes.number,
        value: React.PropTypes.number,
        vertical: React.PropTypes.bool,
        floatValue: React.PropTypes.bool
    },
    getDefaultProps: function() {
        return {
            min: 0,
            max: 100,
            height: -1,
            width: -1,
            value: 0,
            floatValue: false,
            vertical: false,
            hasChanged: function() {}
        };
    },
    getInitialState: function() {
        var value = this.props.value;
        if (value < this.props.min) {
            value = this.props.min;
        } else if (value > this.props.max) {
            value = this.props.max;
        }
        return {
            value: value,
            mouseDown: false
        };
    },
    componentDidMount: function() {
        var percent = (this.state.value - this.props.min) / (this.props.max - this.props.min),
            handleElement = this.refs.handle.getDOMNode();
        if (this.props.vertical) {
            handleElement.style.top = Math.round(percent * 100) + '%';
        } else {
            handleElement.style.left = Math.round(percent * 100) + '%';
        }
    },
    componentDidUpdate: function (props, state) {
        if (this.state.mouseDown && !state.mouseDown) {
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        } else if (!this.state.mouseDown && state.mouseDown) {
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
    },
    setValue: function(val, callChanged) {
        var value, _callChanged;
        if (this.props.floatValue) {
            value = parseFloat(val);
        } else {
            value = parseInt(val);
        }
        if (isNaN(value)) {
            return;
        }
        if (typeof(callChanged) == "undefined") {
            _callChanged = true;
        } else {
            _callChanged = callChanged;
        }
        if (this.state.value !== value) {
            this.setState({value: value, mouseDown: this.state.mouseDown});
            if (_callChanged) {
                this.props.hasChanged(value);
            }
            var percent = (value - this.props.min) / (this.props.max - this.props.min),
                handleElement = this.refs.handle.getDOMNode();
            if (this.props.vertical) {
                handleElement.style.top = Math.round(percent * 100) + '%';
            } else {
                handleElement.style.left = Math.round(percent * 100) + '%';
            }
        }
    },
    handleMouseDown: function(e) {
        e.preventDefault();
        this.setState({value:this.state.value, mouseDown:true});
    },
    handleMouseUp: function(e) {
        e.preventDefault();
        this.setState({value:this.state.value, mouseDown:false});
    },
    handleMouseMove: function(e) {
        if (this.state.mouseDown) {
            this.handleMouseEvent(e);
        }
    },
    handleMouseEvent: function(e) {
        var x, y, percent, tempValue, position, sliderElement, handleElement;
        e.preventDefault();
        x = e.clientX || e.pageX;
        y = e.clientY || e.pageY;
        sliderElement = this.refs.slider.getDOMNode();
        handleElement = this.refs.handle.getDOMNode();
        position = getPosition(sliderElement);
        if (this.props.vertical) {
            percent = (y - position.y) / sliderElement.offsetHeight;
            tempValue = (percent * (this.props.max - this.props.min)) + this.props.min;
            if (tempValue > this.props.max) {
                tempValue = this.props.max;

                handleElement.style.top = '100%';
            } else if (tempValue < this.props.min) {
                tempValue = this.props.min;
                handleElement.style.top = '0%';
            } else {
                handleElement.style.top = (percent * 100) + '%';
                if (!this.props.floatValue) {
                    tempValue = Math.round(tempValue);
                }
            }
        } else {
            percent = (x - position.x) / sliderElement.offsetWidth;
            tempValue = (percent * (this.props.max - this.props.min)) + this.props.min;
            if (tempValue > this.props.max) {
                tempValue = this.props.max;
                handleElement.style.left = '100%';
            } else if (tempValue < this.props.min) {
                tempValue = this.props.min;
                handleElement.style.left = '0%';
            } else {
                handleElement.style.left = (percent * 100) + '%';
                if (!this.props.floatValue) {
                    tempValue = Math.round(tempValue);
                }
            }
            
        }
        if (this.state.value !== tempValue) {
            this.setState({value: tempValue, mouseDown: this.state.mouseDown});
            this.props.hasChanged(tempValue);
        }
    },
    render: function() {
        var style;
        if (this.props.vertical) {
            style = {height:'100%'};
            if (this.props.height > 0) {
                style.height = this.props.height + 'px';
            }
        } else {
            style = {width:'100%'};
            if (this.props.width > 0) {
                style.width = this.props.width + 'px';
            }
        }
        var className = "ljs-slider", classNameHandle="ljs-slider-handle";
        if (this.props.vertical) {
            className = "ljs-vslider";
            classNameHandle="ljs-vslider-handle";
        }
        return (
            <div className={className} style={style} ref="slider"
                onClick={this.handleMouseEvent}
                onMouseMove={this.handleMouseMove}
                onMouseDown={this.handleMouseDown}
                onMouseUp={this.handleMouseUp}>
                <span className={classNameHandle} ref="handle"></span>
            </div>
        )
    }

});

var KnobControl = React.createClass({
    propTypes: {
        hasChanged: React.PropTypes.func,
        value: React.PropTypes.number
    },
    getDefaultProps: function() {
        return {
            value: 0,
            hasChanged: function() {}
        };
    },
    componentDidMount: function() {
        var imgElement = this.refs.knobImg.getDOMNode();
        imgElement.style.transform = "rotate(" + this.state.degValue + "deg)";
        imgElement.style.webkitTransform  = "rotate(" + this.state.degValue + "deg)";
    },
    componentDidUpdate: function (props, state) {
        if (this.state.mouseDown && !state.mouseDown) {
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        } else if (!this.state.mouseDown && state.mouseDown) {
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
    },
    getInitialState: function() {
        return {
            value: this.props.value,
            display: this.props.value + '\xB0',
            degValue: (this.props.value % 360),
            mouseDown: false,
            locked: false,
            changed: false
        };
    },
    unlock: function() {
        this.setState({display:this.state.degValue + '\xB0',
            value:this.state.value,
            degValue:this.state.degValue,
            mouseDown:this.state.mouseDown,
            locked:false,
            changed:false});
    },
    setValue: function(value, callChanged) {
        var degValue, val, _callChanged, dispDeg;
        if (this.state.mouseDown) {
            return; // Set Value does not function when the mouse is down.
        }
        degValue = parseInt(value);
        if (isNaN(degValue)) {
            return;
        }
        if (typeof(callChanged) == "undefined") {
            _callChanged = true;
        } else {
            _callChanged = callChanged;
        }
        val = degValue;
        degValue = degValue % 360;
        while (degValue < 0) {
            degValue = 360 + degValue;
        }
        dispDeg = 360 - degValue;
        if (this.state.locked || this.state.changed) {
            this.setState({display:this.state.display,
                value:val, degValue:degValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});
            
        } else {
            this.setState({display:degValue + '\xB0',
                value:val, degValue:degValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});
        }
        var imgElement = this.refs.knobImg.getDOMNode();
        imgElement.style.transform = "rotate(" + dispDeg + "deg)";
        imgElement.style.webkitTransform  = "rotate(" + dispDeg + "deg)";
        if (_callChanged) {
            this.props.hasChanged({value: value, degValue: degValue});
        }
    },
    getValue: function() {
        return {value: this.state.value, degValue: this.state.degValue};
    },
    getInputValue: function() {
        return this.state.display;
    },
    handleInputChange: function(e) {
        e.preventDefault();
        //var inputElement = this.refs.knobInput.getDOMNode();
        //this.setValue(inputElement.value);
        if (!this.state.changed) {
            this.setState({
                display: event.target.value,
                value: this.state.value,
                degValue: this.state.degValue,
                mouseDown: this.state.mouseDown,
                locked: true,
                changed: true
            });
        } else {
            this.setState({display:event.target.value,
                value:this.state.value,
                degValue:this.state.degValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});
        }
    },
    handleInputClick: function(e) {
        e.preventDefault();
        var inputElement = this.refs.knobInput.getDOMNode();
        //inputElement.setSelectionRange(0, inputElement.value.length - 1);
        inputElement.select();
        
    },
    handleOnFocus: function(e) {
        if (this.state.changed) {
            this.setState({
                display: this.state.display,
                value: this.state.value,
                degValue: this.state.degValue,
                mouseDown: this.state.mouseDown,
                locked: true,
                changed: this.state.changed
            });
        } else {
            this.setState({
                display: this.state.value,
                value: this.state.value,
                degValue: this.state.degValue,
                mouseDown: this.state.mouseDown,
                locked: true,
                changed: this.state.changed
            });
        }
    },
    handleOnBlur: function(e) {
        if (!this.state.changed) {
            this.setState({display:this.state.degValue + '\xB0',
                value:this.state.value,
                degValue:this.state.degValue,
                mouseDown:this.state.mouseDown,
                locked:false,
                changed:this.state.changed});
        } else {
            this.setState({display:this.state.display,
                value:this.state.value,
                degValue:this.state.degValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});
        }
    },
    handleMouseDown: function(e) {
        if (e.target.tagName == 'INPUT') {
            return;
        }
        e.preventDefault();
        this.setState({display:this.state.degValue+ '\xB0',
            value:this.state.value,
            degValue:this.state.degValue,
            mouseDown:true,
            locked:this.state.locked,
            changed:this.state.changed});
    },
    handleMouseUp: function(e) {
        if (e.target.tagName == 'INPUT') {
            return;
        }
        e.preventDefault();
        this.setState({display:this.state.degValue + '\xB0',
            value:this.state.value,
            degValue:this.state.degValue,
            mouseDown:false,
            locked:this.state.locked,
            changed:this.state.changed});
    },
    handleMouseMove: function(e) {
        if (this.state.mouseDown) {
            this.handleClick(e);
        }
    },
    handleClick: function(e) {
        var x, y, ydiff, xdiff, deg, position, box, center, originalDeg, pos, neg, wrapper, value, dispDeg;
        if (e.target.tagName == 'INPUT') {
            return;
        }
        e.preventDefault();
        x = e.clientX || e.pageX;
        y = e.clientY || e.pageY;
        originalDeg = this.state.degValue;
        value = this.state.value;
        wrapper = this.refs.wrapper.getDOMNode();
        position = getPosition(wrapper);
        box = [position.x, position.y, wrapper.offsetWidth, wrapper.offsetHeight];
        center = { x:(box[0] + (box[2] / 2)),
            y:(box[1] + (box[3] / 2))};
        xdiff = center.x - x;
        ydiff = center.y - y;
        deg = ((Math.atan2(ydiff,xdiff) * rad2deg) + 270) % 360;
        deg = Math.round(deg);
        dispDeg = deg;
        deg = 360 - deg;
        if (originalDeg >= deg) {
            neg = originalDeg - deg;
            pos = 360 - originalDeg + deg;
        } else {
            pos = deg - originalDeg;
            neg = originalDeg + 360 - deg;
        }
        if (pos <= neg) {
            value += pos;
        } else {
            value -= neg;
        }
        var imgElement = this.refs.knobImg.getDOMNode();
        imgElement.style.transform = "rotate(" + dispDeg + "deg)";
        imgElement.style.webkitTransform  = "rotate(" + dispDeg + "deg)";
        if (this.state.locked) {
            var inputElement = this.refs.knobInput.getDOMNode();
            inputElement.blur();
        }
        this.setState({display:deg+ '\xB0',
            value:value,
            degValue:deg,
            mouseDown:this.state.mouseDown,
            locked:false,
            changed:false});
        this.props.hasChanged({value:value, degValue:deg});
    },
    render: function() {
        var inputClass = "ljs-knob";
        if (this.state.changed) {
            inputClass += " ljs-knob-locked";
            
        }
        return (
            <div {...this.props} className="ljs-knob-container" ref="wrapper"
                onClick={this.handleClick}
                onMouseMove={this.handleMouseMove}
                onMouseDown={this.handleMouseDown}
                onMouseUp={this.handleMouseUp}>
                <img width="100%" src="" draggable="false" ref="knobImg" />
                <input type="text" className={inputClass} value={this.state.display} ref="knobInput"
                    onClick={this.handleInputClick}
                    onChange={this.handleInputChange}
                    onFocus={this.handleOnFocus}
                    onBlur={this.handleOnBlur} />
            </div>
        );
    }
});


var RobotItem = React.createClass({
    propTypes: {
        linkbot: React.PropTypes.object.isRequired
    },
    componentWillMount: function() {
        var me = this;
        uiEvents.on('hide', function() {
            me.hideMenu();
        }, this.props.linkbot.id);
        uiEvents.on('hide-slider', function(arg) {
            me.hideMenu(arg);
        }, this.props.linkbot.id);
        me.props.linkbot.event.on('changed', me.handleLinkbotChanged);
        me.props.linkbot.getHexColor(function(value) {
            me.setState({color:'#' + value});
        });
    },
    componentWillUnmount: function() {
        uiEvents.off('hide', function() {}, this.props.linkbot.id);
        uiEvents.off('hide-slider', function() {}, this.props.linkbot.id);
        this.props.linkbot.event.off('changed', this.handleLinkbotChanged);
    },
    getInitialState: function() {
        return {
            color: '#606060'
        };
    },
    handleLinkbotChanged: function() {
        var me = this;
        me.props.linkbot.getHexColor(function(value) {
            me.setState({color:'#' + value});
        });
    },
    hideMenu: function() {
        var args = Array.apply([], arguments);
        if (args.length !== 1 || args[0] !== this.props.linkbot.id) {
            this.refs.slideElement.getDOMNode().className = 'ljs-slide-element';
        }
    },
    handleSlide: function(e) {
        e.preventDefault();
        var slider = this.refs.slideElement.getDOMNode();
        if (/ljs-slide-open/.test(slider.className)) {
            // Close Slider.
            slider.className = 'ljs-slide-element';
            uiEvents.trigger('hide-control-panel');
        } else {
            // Open Slider.
            uiEvents.trigger('hide-slider', this.props.linkbot.id);
            slider.className = 'ljs-slide-element ljs-slide-open';
            uiEvents.trigger('show-control-panel', this.props.linkbot);
        }
    },
    handleColorChange: function(e) {
        e.stopPropagation();
        var value = hexToRgb(e.target.value);
        this.props.linkbot.color(value.red, value.green, value.blue);
        e.target.blur();
    },
    handleBeep: function(e) {
        var me = this;
        e.stopPropagation();
        if (me.props.linkbot.status == "offline") {
            uiEvents.trigger('show-full-spinner');
            me.props.linkbot.connect(function(error) {
               uiEvents.trigger('hide-full-spinner');
            });
        } else {
            me.props.linkbot.buzzerFrequency(500);
            setTimeout(function () {
                me.props.linkbot.buzzerFrequency(0);
            }, 250);
        }
    },
    handleTrash: function(e) {
        e.stopPropagation();
        manager.removeRobot(this.props.linkbot.id);
        uiEvents.trigger('hide-control-panel');
    },
    render: function() {
        var style = {
            backgroundColor: this.state.color
        };
        var buttonClass = "ljs-beep-btn";
        var buttonName = "beep";
        if (this.props.linkbot.status === 'offline') {
            buttonClass = "ljs-connect-btn";
            buttonName = "connect";
        }
        var statusClass = 'ljs-robot-status';
        if (this.props.linkbot.status === 'ready') {
            statusClass += ' ljs-icon-ready-status';
        } else if (this.props.linkbot.status === 'acquired') {
            statusClass += ' ljs-icon-acquired-status';
        }
        return (
            <li {...this.props} style={style}>
                <input type="color" className="ljs-color-btn" onInput={this.handleColorChange} />
                <span className="ljs-color-btn-title">color</span>
                <span className="ljs-remove-btn" onClick={this.handleTrash}>trash</span>
                <div className="ljs-slide-element" ref="slideElement" onClick={this.handleSlide}>
                    <span className="ljs-robot-name">Linkbot {this.props.linkbot.id}</span>
                    <span className={buttonClass} onClick={this.handleBeep}>{buttonName}</span>
                    <br />
                    <span className={statusClass}>{this.props.linkbot.status}</span>
                    
                </div>
            </li>
        );

    }

});

var AddRobotForm = React.createClass({
    handleAddRobot: function(e) {
        e.preventDefault();
        var input = this.refs.robotInput.getDOMNode();
        if (input.value && input.value.length == 4) {
            manager.addRobot(input.value);
            input.value = '';
        }
    },
    handleRefresh: function(e) {
        e.preventDefault();
        manager.refresh();
    },
    render:function() {
        return (
            <div id="ljs-add-robot-form">
                <form>
                    <label htmlFor="ljs-add-input" id="ljs-add-input-label" className="sr-only">Linkbot ID</label>
                    <input name="robotId" id="ljs-add-input" type="text" placeholder="Linkbot ID" ref="robotInput" />
                    <button onClick={this.handleAddRobot} className="ljs-btn">Add</button>
                    <button onClick={this.handleRefresh} className="ljs-refreshbtn"></button>
                </form>
            </div>
        );
    }
    
});
var placeholder = document.createElement("li");
placeholder.className = "placeholder";

var Robots = React.createClass({
    componentWillMount: function() {
        var me = this;
        manager.event.on('changed', function() {
            me.setState({robots: manager.getRobots()});
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            robots: manager.getRobots()
        };
    },
    dragStart: function(e) {
        this.dragged = e.currentTarget;
        while (this.dragged.nodeName != 'LI') {
            this.dragged = target.parentNode;
        }
        e.dataTransfer.effectAllowed = 'move';

        // Firefox requires dataTransfer data to be set
        e.dataTransfer.setData("text/html", e.currentTarget);
    },
    dragEnd: function() {
        this.dragged.style.display = "";
        try {
            this.dragged.parentNode.removeChild(placeholder);
        } catch(err) {
            // If not a child of the parent node.
        }

        // Update data
        var from = Number(this.dragged.dataset.id);
        var to = Number(this.over.dataset.id);
        if(from < to) to--;
        if(this.nodePlacement == "after") to++;
        manager.moveRobot(from, to);
    },
    dragOver: function(e) {
        e.preventDefault();
        this.dragged.style.display = "none";
        var target = e.target;
        if (target.nodeName == 'OL') {
            return;
        }
        while (target.nodeName != 'LI') {
            target = target.parentNode;
        }
        if(target.className == "placeholder") return;
        this.over = target;
        // Inside the dragOver method
        var pos = getPosition(this.over);
        var relY = e.clientY - pos.y;
        var height = this.over.offsetHeight / 2;
        var parent = target.parentNode;
        if(relY > height) {
            this.nodePlacement = "after";
            parent.insertBefore(placeholder, target.nextElementSibling);
        }
        else if(relY < height) {
            this.nodePlacement = "before";
            parent.insertBefore(placeholder, target);
        }
    },
    render:function() {
        var me = this;
        var robotItems = this.state.robots.map(function(robot, i) {
           return <RobotItem data-id={i} key={robot.id} linkbot={robot} draggable="true" onDragEnd={me.dragEnd} onDragStart={me.dragStart} />;
        });
        return (
            <ol onDragOver={this.dragOver}>
                {robotItems}
            </ol>
        );
        
    }
    
});

var RobotManagerSideMenu = React.createClass({
    componentWillMount: function() {
        var me = this;
        uiEvents.on('hide', function() {
            me.hideMenu();
        });
        uiEvents.on('hide-menu', function() {
            me.hideMenu();
        });
        uiEvents.on('show-menu', function() {
            me.showMenu();
            manager.refresh();
        });
    },
    hideMenu: function() {
        this.refs.slideBtn.getDOMNode().className = 'ljs-handlebtn ljs-handlebtn-right';
        this.refs.container.getDOMNode().className = '';
        document.body.style.marginLeft = '';
    },
    showMenu: function() {
        this.refs.slideBtn.getDOMNode().className = 'ljs-handlebtn ljs-handlebtn-left';
        this.refs.container.getDOMNode().className = 'ljs-open';
        document.body.style.marginLeft = '300px';
    },
    handleSlide: function(e) {
        e.preventDefault();
        var btn = this.refs.slideBtn.getDOMNode();
        if ( /ljs-handlebtn-left/.test(btn.className) ) {
            // Menu is Open.
            uiEvents.trigger('hide');
        } else {
            // Menu is Closed.
            uiEvents.trigger('show-menu');
        }
    },
    handleFirmwareUpdate: function(e) {
        e.preventDefault();
        linkbotLib.startFirmwareUpdate();
    },
    render: function() {
        return (
            <div id="ljs-left-menu-container" ref="container">
                <div className="ljs-handle">
                    <span onClick={this.handleSlide} className="ljs-handlebtn ljs-handlebtn-right" ref="slideBtn"></span>
                </div>
                <div className="ljs-content">
                    <AddRobotForm />
                    {this.props.children}
                    <div className="ljs-firmware-update">
                        <button onClick={this.handleFirmwareUpdate} className="ljs-btn">Start Firmware Updater</button>
                    </div>
                </div>
            </div>
        );
    }
});

var TopNavigation = React.createClass({
    componentWillMount: function() {
        var me = this;
        manager.event.on('navigation-changed', function() {
            me.setState({
                items: manager.getNavigationItems(),
                title: manager.getNavigationTitle()
            });
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            items: manager.getNavigationItems(),
            title: manager.getNavigationTitle()
        };
    },
    openHelp: function(e) {
        uiEvents.trigger('show-help');
    },
    render: function() {
        var title = this.state.title;
        var navItems = this.state.items.map(function(item, i) {
            var key = "nav-item" + i;
            return (
                <li data-id={i} key={key}>
                    <a href={item.url}>{item.title}</a>
                </li>
            );
        });
        return (
            <div id="ljs-top-navigation">
                <h1 className="ljs-logo"><a href="/index.html">Linkbot Labs</a></h1>
                <div className="ljs-top-nav-info">
                    <ul id="ljs-top-nav-breadcrumbs" className="ljs-top-nav-breadcrumbs">
                        {navItems}
                    </ul>
                    <h1 id="ljs-top-nav-title" className="ljs-top-nav-title">{title}</h1>
                </div>
                <div className="ljs-top-nav-help">
                    <a className="ljs-top-nav-help-link" onClick={this.openHelp}></a>
                </div>
            </div>
        );
    }
});

var ControlPanel = React.createClass({
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            linkbot: null,
            title: 'NONE',
            m1Value: 50,
            m2Value: 50,
            freq: 440,
            wheel1: 0,
            wheel2: 0,
            x: 0.0,
            y: 0.0,
            z: 0.0,
            mag: 0.0
        };
    },
    componentWillMount: function() {
        var me = this;
        uiEvents.on('hide', function() {
            me.hideControlPanel();
        });
        uiEvents.on('hide-control-panel', function() {
            me.hideControlPanel();
        });
        uiEvents.on('show-control-panel', function(linkbot) {
            me.showControlPanel(linkbot);
        });
    },
    componentDidUpdate: function() {

    },
    componentDidMount: function() {
        this.refs.overlay.getDOMNode().style.display = 'none';
        this.refs.controlPanel.getDOMNode().style.display = 'none';
    },
    hideControlPanel: function() {
        this.refs.overlay.getDOMNode().style.display = 'none';
        this.refs.controlPanel.getDOMNode().style.display = 'none';
        if (this.state.linkbot != null) {
            // Clean up here.
            this.state.linkbot.stop();
            this.state.linkbot.unregister(false);
        }
        this.setState({
            linkbot:null,
            title:'NONE',
            m1Value: this.state.m1Value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
    },
    showControlPanel: function(linkbot) {
        var me = this;
        if (this.state.linkbot != null) {
            // Clean up here.
            this.state.linkbot.stop();
            this.state.linkbot.unregister(false);
        }

        if (linkbot.status == "offline") {
            uiEvents.trigger('hide-control-panel');
            return;
        }

        this.refs.overlay.getDOMNode().style.display = 'block';
        this.refs.controlPanel.getDOMNode().style.display = 'block';
        var regObj = {
            accel: {
                callback: function(robot, data, event) {
                    me.refs.xAxis.setValue(event.x);
                    me.refs.yAxis.setValue(event.y);
                    me.refs.zAxis.setValue(event.z);
                    var mag = Math.sqrt((event.x * event.x)  + (event.y * event.y) + (event.z * event.z));
                    me.refs.mag.setValue(mag);
                    me.setState({
                        linkbot:me.state.linkbot,
                        title:me.state.title,
                        m1Value: me.state.m1Value,
                        m2Value: me.state.m2Value,
                        wheel1: me.state.wheel1,
                        wheel2: me.state.wheel2,
                        freq: me.state.freq,
                        x: event.x.toFixed(4),
                        y: event.y.toFixed(4),
                        z: event.z.toFixed(4),
                        mag: mag.toFixed(4)
                    });
                }
            },
            wheel: {
                0: {
                    distance: 1,
                    callback: function(robot, data, event) {
                        positions[0] = event.position;
                        me.refs.knobJoint1.setValue(event.position, false);
                    }
                },
                2: {
                    distance: 1,
                    callback: function(robot, data, event) {
                        positions[2] = event.position;
                        me.refs.knobJoint2.setValue(event.position, false);
                    }
                }
            },
            joint: {
              callback: function(jointNumber, eventType, timestamp) {
                  // TODO implement this.
              }
            },
            button: { }
        };
        regObj.button[linkbot.BUTTON_POWER] = {
            callback: function() {
                window.console.log('Power button pressed');
            }
        };
        regObj.button[linkbot.BUTTON_A] = {
            callback: function() {
                window.console.log('A button pressed');
            }
        };
        regObj.button[linkbot.BUTTON_B] = {
            callback: function() {
                window.console.log('B button pressed');
            }
        };

        //linkbot.angularSpeed(50, 0, 50);

        this.setState({
            linkbot:linkbot,
            title:linkbot.id,
            m1Value: 50,
            m2Value: 50,
            wheel1: me.state.wheel1,
            wheel2: me.state.wheel2,
            freq: 440,
            x: 0.0,
            y: 0.0,
            z: 0.0,
            mag: 0.0
        }, function() {
            me.state.linkbot.register(regObj);
            me.refs.buzzerFrequency.setValue(440);
            me.refs.speedJoint1.setValue(50);
            me.refs.speedJoint2.setValue(50);
            linkbot.wheelPositions(function(data) {
                var pos = data.values;
                positions = pos;
                me.setState({
                    linkbot:me.state.linkbot,
                    title:me.state.title,
                    m1Value: me.state.m1Value,
                    m2Value: me.state.m2Value,
                    wheel1: pos[0],
                    wheel2: pos[2],
                    freq: me.state.freq,
                    x: me.state.x,
                    y: me.state.y,
                    z: me.state.z,
                    mag: me.state.mag
                }, function() {
                    me.refs.knobJoint1.setValue(pos[0], false);
                    me.refs.knobJoint2.setValue(pos[2], false);
                });
            });
        });
        linkbot.getJointSpeeds(function(data) {
            var d1 = Math.round(data[0]);
            var d2 = Math.round(data[2]);
            me.setState({
                linkbot:me.state.linkbot,
                title:me.state.title,
                m1Value: d1,
                m2Value: d2,
                wheel1: me.state.wheel1,
                wheel2: me.state.wheel2,
                freq: me.state.freq,
                x: me.state.x,
                y: me.state.y,
                z: me.state.z,
                mag: me.state.mag
            });
            me.refs.speedJoint1.setValue(d1);
            me.refs.speedJoint2.setValue(d2);
        });
    },
    knob1Changed: function(data) {
        if (this.state.wheel1 === data.value) {
            return;
        }
        var me = this;
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m1Value,
            m2Value: this.state.m2Value,
            wheel1: data.value,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        }, function() {
            me.state.linkbot.driveToLimiter(data.value, 0, positions[2], positions[0], 0, positions[2]);
        });
    },
    knob2Changed: function(data) {
        if (this.state.wheel2 === data.value) {
            return;
        }
        var me = this;
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m1Value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: data.value,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        }, function() {
            me.state.linkbot.driveToLimiter(positions[0], 0, data.value, positions[0], 0, positions[2]);
        });
    },
    motor1Up: function() {
        this.state.linkbot.moveJointContinuous(0, 1);
    },
    motor1Stop: function() {
        this.state.linkbot.moveJointContinuous(0, 0);
    },
    motor1Down: function() {
        this.state.linkbot.moveJointContinuous(0, -1);
    },
    motor2Up: function() {
        this.state.linkbot.moveJointContinuous(2, 1);
    },
    motor2Stop: function() {
        this.state.linkbot.moveJointContinuous(2, 0);
    },
    motor2Down: function() {
        this.state.linkbot.moveJointContinuous(2, -1);
    },
    motor1Speed: function(value) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
        this.state.linkbot.angularSpeed(value, 0, this.state.m2Value);
    },
    motor2Speed: function(value) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m1Value,
            m2Value: value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
        this.state.linkbot.angularSpeed(this.state.m1Value, 0, value);
    },
    driveForward: function() {
        this.state.linkbot.moveForward();
    },
    driveDown: function() {
        this.state.linkbot.moveBackward();
    },
    driveLeft: function() {
        this.state.linkbot.moveLeft();
    },
    driveRight: function() {
        this.state.linkbot.moveRight();
    },
    driveZero: function() {
        this.state.linkbot.moveTo(0, 0, 0);
    },
    driveStop: function() {
        this.state.linkbot.stop();
    },
    frequencyChanged: function(value) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m1Value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: value,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
    },
    beepButton: function() {
        var me = this;
        me.state.linkbot.buzzerFrequency(this.state.freq);
        setTimeout(function() { me.state.linkbot.buzzerFrequency(0); }, 250);
    },
    moveButtonPressed: function() {
        var v1, v2;
        v1 = parseInt(this.refs.knobJoint1.getInputValue());
        v2 = parseInt(this.refs.knobJoint2.getInputValue());
        if (isNaN(v1)) {
            v1 = this.state.wheel1;
        }
        if (isNaN(v2)) {
            v2 = this.state.wheel2;
        }
        this.state.linkbot.angularSpeed(this.state.m1Value, 0, this.state.m2Value);
        this.state.linkbot.moveTo(v1, 0, v2);
        this.refs.knobJoint1.unlock();
        this.refs.knobJoint2.unlock();
    },
    hideAll: function() {
        uiEvents.trigger('hide');
    },
    render: function() {
        return (
            <div>
                <div id="ljs-overlay" ref="overlay" onClick={this.hideAll} />
                <div id="ljs-control-panel" ref="controlPanel">
                    <div className="ljs-control-header">
                        <div className="ljs-control-title">
                            <h1>Linkbot {this.state.title}</h1>
                        </div>
                    </div>
                    <div className="ljs-row">
                        <div className="ljs-control-col">
                            <div className="ljs-control-poster">
                                <div className="ljs-btn-group">
                                    <KnobControl value={0} ref="knobJoint1" hasChanged={this.knob1Changed} />
                                </div>
                                <div className="ljs-btn-group">
                                    <KnobControl value={0} ref="knobJoint2" hasChanged={this.knob2Changed} />
                                </div>
                            </div>
                            <div className="ljs-control-poster">
                                <div className="ljs-btn-group">
                                    <SliderControl min={1} max={200} width={100} value={50}  ref="speedJoint1" hasChanged={this.motor1Speed} />
                                    <p><span>{this.state.m1Value}</span> deg/sec</p>
                                </div>
                                <div className="ljs-btn-group ljs-second-slider">
                                    <SliderControl min={1} max={200} width={100} value={50}  ref="speedJoint2" hasChanged={this.motor2Speed} />
                                    <p><span>{this.state.m2Value}</span> deg/sec</p>
                                </div>
                                <div>
                                    <button className="drive-control-btn-lg ljs-btn-zero" onClick={this.moveButtonPressed}>move</button>
                                </div>
                            </div>
                            <div className="ljs-control-poster">
                                <div className="ljs-btn-group">
                                    <button className="ljs-btn-up joint-control-btn" onClick={this.motor1Up}>joint 1 up</button>
                                    <button className="ljs-btn-stop joint-control-btn" onClick={this.motor1Stop}>joint 1 stop</button>
                                    <button className="ljs-btn-down joint-control-btn" onClick={this.motor1Down}>joint 1 down</button>
                                </div>
                                <div className="ljs-btn-group">
                                    <button className="ljs-btn-up joint-control-btn" onClick={this.motor2Up}>joint 2 up</button>
                                    <button className="ljs-btn-stop joint-control-btn" onClick={this.motor2Stop}>joint 2 stop</button>
                                    <button className="ljs-btn-down joint-control-btn" onClick={this.motor2Down}>joint 2 down</button>
                                </div>
                            </div>
                            <div className="ljs-control-poster">
                                <div>
                                    <button className="drive-control-btn-sm ljs-btn-up" onClick={this.driveForward}>up</button>
                                </div>
                                <div>
                                    <button className="drive-control-btn-sm ljs-btn-left" onClick={this.driveLeft}>left</button>
                                    <button className="drive-control-btn-sm ljs-btn-down" onClick={this.driveDown}>down</button>
                                    <button className="drive-control-btn-sm ljs-btn-right" onClick={this.driveRight}>right</button>
                                </div>       
                                <div>
                                    <button className="drive-control-btn-lg ljs-btn-zero" onClick={this.driveZero}>zero</button>
                                </div>       
                                <div>
                                    <button className="drive-control-btn-lg ljs-btn-stop" onClick={this.driveStop}>stop</button>
                                </div>
                            </div>
                        </div>
                        <div className="ljs-control-col">
                            <div className="ljs-control-poster">
                                <div className="ljs-buzzer">
                                    <span>buzzer frequency (hz):</span> <span>{this.state.freq}</span>
                                    <SliderControl min={130} max={1000} value={440} width={165} ref="buzzerFrequency" hasChanged={this.frequencyChanged} />
                                </div>
                                <div className="ljs-btn-group" onClick={this.beepButton}>
                                    <span className="ljs-beep-btn">beep</span>
                                </div>
                            </div>
                            <div className="ljs-control-poster ljs-vertical-group">
                                <div>
                                    <SliderControl  min={-5} max={5} height={350} ref="xAxis" floatValue={true} vertical={true} />
                                    <p>x:<br /><span id="accel-xaxis-value">{this.state.x}</span></p>
                                </div>
                                <div>
                                    <SliderControl  min={-5} max={5} height={350} ref="yAxis" floatValue={true} vertical={true} />
                                    <p>y:<br /><span id="accel-yaxis-value">{this.state.y}</span></p>
                                </div>
                                <div>
                                    <SliderControl  min={-5} max={5} height={350} ref="zAxis" floatValue={true} vertical={true} />
                                    <p>z:<br /><span id="accel-zaxis-value">{this.state.z}</span></p>
                                </div>
                                <div>
                                    <SliderControl  min={-5} max={5} height={350} ref="mag" floatValue={true} vertical={true} />
                                    <p>mag:<br /><span id="accel-mag-value">{this.state.mag}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

var MainOverlay = React.createClass({
    componentWillMount: function() {
        var me = this;
        uiEvents.on('show-full-spinner', function() {
            me.setState({
                show: true
            });
        });
        uiEvents.on('hide-full-spinner', function() {
            me.setState({
                show: false
            });
        });
    },
    handleClick: function(e) {
        e.stopPropagation();
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            show: false
        };
    },
    render: function() {
        var divStyle = {display:'none'};
        if (this.state.show) {
            divStyle = {display:'block'};
        }
        return (
            <div>
                <div id="ljs-overlay-full" style={divStyle} ref="overlay" onClick={this.handleClick}>
                    <div id="ljs-overlay-spinner"></div>
                </div>
            </div>
        );

    }
});

var ErrorConsole = React.createClass({
    componentWillMount: function() {
        var me = this;

        uiEvents.on('add-error', function(error) {
            var errors = me.state.errors.slice();
            errors.unshift(error);
            me.setState({
                show: true,
                errors: errors
            });
        });
        uiEvents.on('hide-console', function() {
            me.setState({
                show: false,
                errors: me.state.errors
            });
        });
    },
    handleClick: function(e) {
        e.stopPropagation();
    },
    close: function(e) {
        this.setState({
            show: false,
            errors: this.state.errors
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            show: false,
            errors:[]
        };
    },
    render: function() {
        var divStyle = {display:'none'};
        var clzz = "ljs-modal ljs-fade";
        if (this.state.show) {
            divStyle = {display:'block'};
            clzz = "ljs-modal ljs-fade ljs-in";
        }
        var errorItems = this.state.errors.map(function(error, i) {
            var key = 'error-item' + i;
            return (
                <li data-id={i} key={key}>
                   {error}
                </li>
            );
        });
        return (
            <div>
                <div id="ljs-error-console" style={divStyle} className={clzz} ref="overlay" onClick={this.handleClick}>
                    <div className="ljs-modal-dialog">
                        <div className="ljs-modal-content">
                            <div className="ljs-modal-header">
                                <h4 className="ljs-modal-title">Error Log</h4>
                            </div>
                            <div className="ljs-modal-body">
                                <ul>
                                    {errorItems}
                                </ul>
                            </div>
                            <div className="ljs-modal-footer">
                                <button type="button" className="ljs-btn ljs-primary-btn" onClick={this.close}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});
var HelpDialog = React.createClass({
    componentWillMount: function() {
        var me = this;

        uiEvents.on('show-help', function() {
            me.setState({
                show: true
            });
        });
        uiEvents.on('hide-help', function() {
            me.setState({
                show: false
            });
        });
    },
    handleClick: function(e) {
        e.stopPropagation();
    },
    close: function(e) {
        this.setState({
            show: false
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            show: false
        };
    },
    render: function() {
        var divStyle = {display:'none'};
        var clzz = "ljs-modal ljs-fade";
        if (this.state.show) {
            divStyle = {display:'block'};
            clzz = "ljs-modal ljs-fade ljs-in";
        }
        return (
            <div>
                <div id="ljs-error-console" style={divStyle} className={clzz} ref="overlay" onClick={this.handleClick}>
                    <div className="ljs-modal-dialog">
                        <div className="ljs-modal-content">
                            <div className="ljs-modal-header">
                                <h4 className="ljs-modal-title">Help</h4>
                            </div>
                            <div className="ljs-modal-body">
                                <ul>
                                    <li><a href="http://wiki.linkbotlabs.com/wiki/Learning_Python_3_with_the_Linkbot/FAQ">FAQ / Wiki</a></li>
                                    <li><a href="http://www.barobo.com/forums/forum/troubleshootinghelp/">Help / Forums</a></li>
                                    <li><a href="https://docs.google.com/forms/d/1rnqRu8XBHxDqLS257afRNH8nUycVUAbLaD7iOP4EyMg/viewform?usp=send_form">Bug Report</a></li>
                                </ul>
                            </div>
                            <div className="ljs-modal-footer">
                                <button type="button" className="ljs-btn ljs-primary-btn" onClick={this.close}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports.uiEvents = uiEvents;

module.exports.addUI = function() {
    var sideMenuDiv = document.createElement('div');
    var controlPanelDiv = document.createElement('div');
    var navMenuDiv = document.createElement('div');
    var helpDiv = document.createElement('div');
    var consoleDiv = document.createElement('div');
    var mainOverlayDiv = document.createElement('div');
    document.body.appendChild(sideMenuDiv);
    document.body.appendChild(navMenuDiv);
    document.body.appendChild(controlPanelDiv);
    document.body.appendChild(helpDiv);
    document.body.appendChild(consoleDiv);
    document.body.appendChild(mainOverlayDiv);
    document.body.style.marginTop = "90px";
    React.render(<ControlPanel />, controlPanelDiv);
    React.render(<RobotManagerSideMenu><Robots /></RobotManagerSideMenu>, sideMenuDiv);
    React.render(<TopNavigation />, navMenuDiv);
    React.render(<HelpDialog />, helpDiv);
    React.render(<ErrorConsole />, consoleDiv);
    React.render(<MainOverlay />, mainOverlayDiv);
};
