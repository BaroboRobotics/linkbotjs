# BaroboJS API

This API has four methods for managing robots, and a
<a href="#linkbot">Linkbot class</a>
for controlling individual robots. The four management methods are
<a href="#scan">scan</a>,
<a href="#connect">connect</a>,
<a href="#reactimate">reactimate</a>, and
<a href="#deactimate">deactimate</a>.

Obtain a Linkbot object with
<a id="connect">**connect**</a>:

    var linkbot = Barobo.connect(id);

Now you can use the following class to control that robot.

<a id="linkbot"></a>
## Linkbot Class

Linkbot control methods are
<a href="#color">color</a>,
<a href="#angSpeed">angularSpeed</a>,
<a href="#move">move</a>,
<a href="#stop">stop</a>, and
<a href="#disconnect">disconnect</a>.

<a id="color"></a>
**color** sets the robot's LED. Inputs are *r*, *g*, *b*, with values
0–255.

    linkbot.color(255, 0, 0); // Set LED to red.

<a id=angSpeed></a>
**angularSpeed**
sets motor speed, in radians per second. This is treated as a magnitude:
only use positive values. [Explain three arguments. Which are which?]

    linkbot.angularSpeed(1, 2, 1);

    /* bad: negative numbers */
    /* linkbot.angularSpeed(-1, 1, 2) */

If you only pass one argument, BaroboJS will use that speed for all the
motors.

    /* same as linkbot.angularSpeed(1,1,1) */
    linkbot.angularSpeed(1);

<a id=move></a>
**move**
runs the motors the specified number of radians. The speed they move at is
controlled by <a href="#angSpeed">angularSpeed</a>, above. Positive values
move the motor clockwise.

    linkbot.move(1, 0, -1);

<a id=stop></a>
**stop**
is an emergency stop!

    linkbot.stop();

<a id=disconnect></a>
**disconnect**
relinquishes control of the robot. It also invalidates the object it is
executed on by nulling out its id attribute. Let me know if that's weird.

    linkbot.disconnect();

Those five methods are it for the Linkbot class!

## Robot Management Methods

Recall that there are four methods: **scan**, **connect**,
**reactimate**, and **deactimate**.

<a id=scan></a>
**scan** returns a list of ids.


<a id=connect></a>
**connect** is straightforward, though RobotBridge might throw something
nasty.

    connect = function(id) {
      RobotBridge.connect(id);
      return new Linkbot(id);
    };

<a id=reactimate></a>
**reactimate** is a funny word that means, "Do certain things based on
robot activity." Let's talk about this for a second.

### Aside: reactimate

Here's a small example.

    var appData, robot;

    robot = Barobo.connect();

    appData = {
      mine: 0,
      bobs: 0,
      myId: robot._id
    };

    Barobo.reactimate({
      button: function(robotID, data, event) {
        if (robotID === data.myID && event.button === 1) {
          return data.mine += 1;
        } else {
          return data.bobs += 1;
        }
      }
    }, appData);

What's happening here is a callback is being registered for button
events. The callback gets information on the robot that triggered the
event, as well as the event itself. It also gets access to the value
passed as the second argument to reactimate. This lets you write pure
functions, hooray! That should let you play nicely with frameworks like
Angular or Serenade.

### Reactimate connections
These are the actions you can attach callbacks to.
robotActions = [ 'button', 'wheel' ]

You've already seen an example of *button*. Here's a *wheel* example.

```
    /* TODO: Wheel example */
```

    var reactimate;

    reactimate = function(connections, model) {
      if (connections.button != null) {
        if (internal.buttonAction != null) {
          RobotBridge.button.disconnect(internal.buttonAction);
        }
        internal.buttonAction = function(robID, btnID) {
          return connections.button(robID, model, {
            button: btnID
          });
        };
        RobotBridge.button.connect(internal.buttonAction);
      }
      if (connections.wheel != null) {
        if (internal.wheelAction != null) {
          RobotBridge.wheel.disconnect(internal.wheelAction);
        }
        internal.wheelAction = function(robID, wheelID, direction) {
          return internal.handleWheel(robID, wheelID, direction, model);
        };
        return RobotBridge.wheel.connect(internal.wheelAction);
      }
    };

<a id=deactimate></a>
**deactimate** takes an Array of connections to stop caring about, and
promptly stops caring about them.

    deactimate = function(connections) {
      if ((connections['button'] != null) && (internal.wheelAction != null)) {
        RobotBridge.button.disconnect(internal.wheelAction);
        internal.buttonAction = null;
      }
      if ((connections['wheel'] != null) && (internal.wheelAction != null)) {
        RobotBridge.wheel.disconnect(internal.wheelAction);
        return internal.wheelAction = null;
      }
    };

## Integrating with BaroboLab

## Including the API in your code
