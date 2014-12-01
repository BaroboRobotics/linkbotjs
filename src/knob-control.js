var LinkbotControls = (function(parent, doc) {
	"use strict";
	var me = parent.knob = parent.knob || {};
	var knobs = [];
	var knobsMap = {};

	function mouseUp(e) {
		for (var i in knobs) {
			var knob = knobs[i];
			knob.setDown(false);
		}
	}
	function mouseMove(e) {
		var clickX = e.clientX || e.pageX;
		var clickY = e.clientY || e.pageY;
		for (var i in knobs) {
			var knob = knobs[i];
			if (knob.isDown()) {
				knob.updateXY(clickX, clickY);
			}
		}
	}

	function KnobControl(element) {
			var inputElement = element;
			var parent = element.parentElement;
			var wrapper = document.createElement('div');
			var imgElement = document.createElement('img');
			var down = false;
			var rad2deg = 180/Math.PI;
			var inputValue = 0;
			var internalValue = 0;
			var changeRegister = [];

			wrapper.setAttribute('class', 'linkbotjs-knob-container');
			parent.replaceChild(wrapper, inputElement);
			inputElement.setAttribute('value', inputValue);
			imgElement.setAttribute('width', '100%');
			imgElement.draggable = false;
			wrapper.appendChild(imgElement);
			wrapper.appendChild(inputElement);
			

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

			
			
			return {
				getKnob: function() {
					return wrapper;
				},
				getKnobInput: function() {
					return inputElement;
				},
				getKnobImage: function() {
					return imgElement;
				},
				setDown: function(value) {
					down = value;
				},
				isDown: function() {
					return down;
				},
				getPosition: function() {
					return getPosition(wrapper);
				},
				getCenter: function() {
					var position = getPosition(wrapper);
					var box = [position.x, position.y, wrapper.offsetWidth, wrapper.offsetHeight];
					var center = { x:(box[0] + (box[2] / 2)),
						   y:(box[1] + (box[3] / 2))};
					return center;
				},
				updateXY: function(x, y) {
					var ydiff, xdiff, deg, position, box, center, i, originalDeg, pos, neg;
					originalDeg = inputValue;
					position = getPosition(wrapper);
					box = [position.x, position.y, wrapper.offsetWidth, wrapper.offsetHeight];
					center = { x:(box[0] + (box[2] / 2)),
						   y:(box[1] + (box[3] / 2))};
					xdiff = center.x - x;
					ydiff = center.y - y;
					deg = ((Math.atan2(ydiff,xdiff) * rad2deg) + 270) % 360;
					deg = Math.round(deg);

					if (originalDeg >= deg) {
						neg = originalDeg - deg;
						pos = 360 - originalDeg + deg;

					} else {
						pos = deg - originalDeg;
						neg = originalDeg + 360 - deg;
					}
					if (pos <= neg) {
						internalValue += pos;
					} else {
						internalValue -= neg;
					}
					console.log(internalValue);
					imgElement.style.transform = "rotate(" + deg + "deg)";
					imgElement.style.webkitTransform  = "rotate(" + deg + "deg)";
					inputElement.value = deg;
					inputValue = deg;
					for (i = 0; i < changeRegister.length; i++) {
						changeRegister[i](deg);
					}
				},
				setValue: function(value) {
					var intValue, i;
					intValue = parseInt(value);
					if (isNaN(intValue)) {
						inputElement.value = inputValue;
						return;
					}
					internalValue = intValue;
					intValue = intValue % 360;
					while (intValue < 0) {
						intValue = 360 + intValue; 
					}
					imgElement.style.transform = "rotate(" + intValue + "deg)";
					imgElement.style.webkitTransform  = "rotate(" + intValue + "deg)";
					inputValue = intValue;
					inputElement.value = inputValue;
					for (i = 0; i < changeRegister.length; i++) {
						changeRegister[i](intValue);
					}
				},
				getValue: function() {
					return inputValue;
				},
				getInternalValue: function() {
					return internalValue;
				},
				addChangeCallback: function(callback) {
					changeRegister.push(callback);
				}
			};
	}
	me.add = function(param) {
		var element = null;
		if (param instanceof HTMLElement) {
			element = param;
		} else {
			element = doc.getElementById(param);
		}
		if (!element || element === null) {
			return;
		}
		var knobControl = new KnobControl(element);
		knobControl.getKnob().addEventListener('mousedown', function(e) {
			if (e.button === 0) {
				knobControl.setDown(true);
			}
		});
		knobControl.getKnob().addEventListener('click', function(e) {
			var clickX = e.clientX || e.pageX;
			var clickY = e.clientY || e.pageY;
			knobControl.updateXY(clickX, clickY);
		});
		knobControl.getKnobInput().addEventListener('click', function(e) { e.stopPropagation(); }, true);
		knobControl.getKnobInput().addEventListener('onchange', function(e) {
		 	knobControl.setValue(e.target.value);
		});
		knobControl.getKnobInput().addEventListener('keyup', function(e) {
			knobControl.setValue(e.target.value);
		});
		knobControl.getKnobInput().addEventListener('mousedown', function(e) { e.stopPropagation(); }, true);
		if (element.id) {
			knobsMap[element.id] = knobControl;
		}
		knobs.push(knobControl);
	};
	me.init = function() {
		doc.addEventListener('mouseup', mouseUp);
		doc.addEventListener('mousemove', mouseMove);
		var elements = document.getElementsByClassName('linkbotjs-knob');
		for (var i = 0; i < elements.length; i++) {
			me.add(elements[i]);
		}
	};
	me.get = function(id) {
		return knobsMap[id];
		
	};
	me.getValue = function(id) {
		var knob = knobsMap[id];
		if (knob) {
			return knob.getValue();
		}
		
		return null;
	};
	me.getInternalValue = function(id) {
		var knob = knobsMap[id];
		if (knob) {
			return knob.getInternalValue();
		}
	};
	me.addChangeCallback = function(id, callback) {
		var knob = knobsMap[id];
		if (knob) {
			return knob.addChangeCallback(callback);
		}
	};
	return parent;
}(LinkbotControls || {}, document));
