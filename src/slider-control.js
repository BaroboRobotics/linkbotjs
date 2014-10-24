var LinkbotControls = (function(parent, doc) {
	"use strict";
	parent.slider = parent.slider || {};
	var me = parent.slider;
	var sliders = [];
	var slidersMap = {};

	function mouseMove(e) {
		var clickX = e.clientX || e.pageX;
		var clickY = e.clientY || e.pageY;
		for (var i in sliders) {
			var slider = sliders[i];
			if (slider.isDown()) {
				slider.updateXY(clickX, clickY);
				if(e.stopPropagation) e.stopPropagation();
			    if(e.preventDefault) e.preventDefault();
			    e.cancelBubble=true;
			    e.returnValue=false;
			    return false;
			}
		}
	}

	function mouseUp(e) {
		for (var i in sliders) {
			var slider = sliders[i];
			slider.setDown(false);
		}
	}

	function SliderControl(element) {
		var value = 0;
		var min = 0;
		var max = 100;
		var down = false; // mouse down.
		var changeRegister = [];
		var type = "int";
		if (element.dataset.type) {
			type = element.dataset.type;
		}
		if (element.dataset.min) {
			min = parseInt(element.dataset.min);
		}
		if (element.dataset.max) {
			max = parseInt(element.dataset.max);
		}
		var handleElement = document.createElement('span');
		var vertical = false;
		if (element.classList.contains('linkbotjs-vslider')) {
			vertical = true;
			handleElement.style.top = "0";
			handleElement.setAttribute('class', 'linkbotjs-vslider-handle');
		} else {
			handleElement.setAttribute('class', 'linkbotjs-slider-handle');
			handleElement.style.left = "0";
		}
		var sliderElement = element;
		sliderElement.innerHTML = "";
		sliderElement.appendChild(handleElement);

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
			getSlider: function() {
				return sliderElement;
			},
			getHandle: function() {
				return handleElement;
			},
			isVertical: function() {
				return vertical;
			},
			isDown: function() {
				return down;
			},
			setDown: function(val) {
				down = val;
			},
			updateXY: function(x, y) {
				var diff, val, tempValue;
				var position = getPosition(sliderElement);
				var box = [position.x, position.y, sliderElement.offsetWidth, sliderElement.offsetHeight];
				if (vertical) {
					diff = y - position.y;
					val = diff / box[3];
					tempValue = (val * (max - min)) + min;
					if (tempValue > max) {
						value = max;
						handleElement.style.top = '100%';
					} else if (tempValue < min) {
						value = min;
						handleElement.style.top = '0%';
					} else {
						handleElement.style.top = (val * 100) + '%';
						if (type === "int") {
							value = Math.round(tempValue);
						} else {
							value = tempValue;
						}
					}
				} else {
					diff = x - position.x;
					val = diff / box[2];
					tempValue = (val * (max - min)) + min;
					if (tempValue > max) {
						value = max;
						handleElement.style.left = '100%';
					} else if (tempValue < min) {
						value = min;
						handleElement.style.left = '0%';
						return;
					} else {
						handleElement.style.left = (val * 100) + '%';
						if (type === "int") {
							value = Math.round(tempValue);
						} else {
							value = tempValue;
						}
					}
				}
				for (var i in changeRegister) {
					changeRegister[i](value);
				}
			},
			setValue: function(val) {
				var newValue = 0;
				if (type === "int") {
					newValue = parseInt(val);
				} else if (type == "float") {
					newValue = parseFloat(val);
				}
				
				var percent;
				if (vertical) {
					percent = (newValue - min) / (max - min);
					handleElement.style.top = (percent * 100) + '%';
					value = newValue;
				} else {
					percent = (newValue - min) / (max - min);
					handleElement.style.left = (percent * 100) + '%';
					value = newValue;
				}
				for (var i in changeRegister) {
					changeRegister[i](value);
				}
			},
			getValue: function() {
				return value;
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
		var sliderControl = new SliderControl(element);
		sliderControl.getSlider().addEventListener('mousedown', function(e) {
			if (e.button === 0) {
				sliderControl.setDown(true);
			}
		});
		sliderControl.getSlider().addEventListener('click', function(e) {
			var clickX = e.clientX || e.pageX;
			var clickY = e.clientY || e.pageY;
			sliderControl.updateXY(clickX, clickY);
		});
		if (element.id) {
			slidersMap[element.id] = sliderControl;
		}
		sliders.push(sliderControl);
	};

	me.init = function() {
		doc.addEventListener('mouseup', mouseUp);
		doc.addEventListener('mousemove', mouseMove);
		var elements = document.getElementsByClassName('linkbotjs-vslider');
		var i = 0;
		for (i = 0; i < elements.length; i++) {
			me.add(elements[i]);
		}
		elements = document.getElementsByClassName('linkbotjs-slider');
		for (i = 0; i < elements.length; i++) {
			me.add(elements[i]);
		}
	};
	me.get = function(id) {
		return slidersMap[id];
	};
	me.getValue = function(id) {
		var slider = slidersMap[id];
		if (slider) {
			return slider.getValue();
		}
		return null;
	};
	me.addChangeCallback = function(id, callback) {
		var slider = slidersMap[id];
		if (slider) {
			return slider.addChangeCallback(callback);
		}
	};
	return parent;
}(LinkbotControls || {}, document));
