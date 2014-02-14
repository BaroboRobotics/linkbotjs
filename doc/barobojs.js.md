# LinkbotJS API

This API has four methods for managing robots, and a
<a href="#linkbot">Linkbot class</a>
for controlling individual robots. The four management methods are
<a href="#scan">scan</a>,
<a href="#connect">connect</a>,
<a href="#reactimate">reactimate</a>, and
<a href="#deactimate">deactimate</a>.

Obtain a Linkbot object with
<a id="connect">**connect**</a>:

    var linkbot = LinkbotMgr.connect(id);

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
sets motor speed, in radians per second. This is treated as a magnitude.
Only use positive values. [Explain three arguments. Which are which?]

    linkbot.angularSpeed(1, 2, 1);

    /* bad: negative numbers */
    /* linkbot.angularSpeed(-1, 1, 2) */

If you only pass one argument, LinkbotJS will use that speed for all the
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
executed on by nulling out the id attribute. Let me know if that's weird.

    linkbot.disconnect();

Those five methods are it for the Linkbot class!

## LinkbotMgr Methods

Recall that there are four LinkbotMgr methods:
<a href="#scan">scan</a>,
<a href="#connect">connect</a>,
<a href="#reactimate">reactimate</a>, and
<a href="#deactimate">deactimate</a>.


<a id=scan></a>
**scan** returns a list of ids.

    var availIds = LinkbotMgr.scan();

<a id=connect></a>
**connect** is straightforward, though it might throw an error if the
connection fails. As mentioned above, it returns a <a
href="#linkbot">Linkbot</a> object.

    var linkbot;
    try {
        linkbot = LinkbotMgr.connect(id);
    } catch(/* TODO */) {
    }

<a id=reactimate></a>
**reactimate** is a funny word that means, "Do certain things based on
robot activity." I'll show an example of its use, then explain what's going
on.

    var handleClick = function(robot, data, event) {
      if (robot === data.myRobot) {
        data.mine += 1;
      } else {
        data.other += 1;
      }
    };

    var appData = {
      mine: 0,
      other: 0,
      myRobot: LinkbotMgr.connect(id)
    };

    LinkbotMgr.reactimate({ button: handleClick }, appData);

What's happening here is a callback is being registered for button events.

Reactimate's first argument is a connection map. The keys are events to act
upon, and the values can be callbacks or, in some cases, a collection of
callbacks. (See <a href="#wheel">wheel</a>, for example.)

As demonstrated by handleClick, callbacks receive three arguments. The
first is the robot object corresponding to the robot that triggered the
event. The second is the second argument to reactimate (appData, in this
case). The third argument is an object containing information about the
event itself.

This example only uses the 'button' connection. See the section on <a
href="#connections">connections</a>, below, for a list of available
connections and descriptions of event-information objects.

<a id=deactimate></a>
**deactimate** takes a variable number of connections to stop caring about,
and promptly stops caring about them.

    /* banish buttons actions */
    deactimate('button');

    /* or, ignore button *and* wheel events. */
    deactimate('button', 'wheel');

<a id="connections"></a>
### Reactimate connections

<dl>
<a id="button"></a>
<dt>button</dt>
<dd>
See [reactimate](#reactimate) for a usage example. The event object that
callbacks receive will be of form `{ buttonID: int }`
</dd>
<a id="wheel"></a>
<dt>wheel</dt>
<dd>
wheel events are more complicated because you can specify how many degrees
to wait before an event is triggered. To support this, the connection value
can be a map:

    LinkbotMgr.reactimate({ wheel: { 20: scrollEvent } });

However, if you just want events as frequently as possible, you can pass a
single function instead of a map:

    /* these are identical */
    LinkbotMgr.reactimate({ wheel: moveEvent });
    LinkbotMgr.reactimate({ wheel: { 0 : moveEvent }});

Keys are expected to be (positive) magnitudes. The event object that
callbacks receive will be of form `{ wheelID: int, distance: double }`.
'distance' will be positive if the motion was clockwise.
</dd>
</dl>

## Including the API in your code

Eventual support of require.js is planned, but for now, include linkbot.js
before your application code, and LinkbotMgr will be available at the
global scope.
