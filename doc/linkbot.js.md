# LinkbotJS API

This is the user documentation for LinkbotJS. It describes version 0.0.3,
which is available here:

* <a href="linkbot.js.zip">linkbot.js.zip v0.0.3</a>

Source code and contributor documentation is available on Github at
<a target=_new href="https://github.com/BaroboRobotics/LinkbotJS">BaroboRobotics/LinkbotJS</a>.

-----------

This API has two methods for managing robots and a
<a href="#linkbot">Linkbot class</a>
for controlling individual robots. The two management methods are
<a href="#scan">scan</a> and
<a href="#connect">connect</a>.

<a id="Linkbots"></a>
## Linkbots Object Methods

<a id=scan></a>
**scan** returns a list of ids.

    var availIds = Linkbots.scan();

<a id=connect></a>
**connect** is straightforward, though it might throw an error if the
connection fails. As mentioned above, it returns a <a
href="#linkbot">Linkbot</a> object.

    var bot;
    try {
        bot = Linkbots.connect(id);
    } catch(/* TODO */) { }

<a id="linkbot"></a>
## Linkbot Class

To get started, obtain a Linkbot object with
<a href="#connect">connect</a>:

    var bot = Linkbots.connect(id);

Linkbot objects have the following methods:
<a href="#color">color</a>,
<a href="#angSpeed">angularSpeed</a>,
<a href="#move">move</a>,
<a href="#stop">stop</a>,
<a href="#disconnect">disconnect</a>,
<a href="#register">register</a>, and
<a href="#unregister">unregister</a>.

### Controlling the Linkbot

<a id="color"></a>
**color** sets the robot's LED. Inputs are *r*, *g*, *b*, with values
0–255.

    bot.color(255, 0, 0); // Set LED to red.

<a id=angSpeed></a>
**angularSpeed**
sets wheel speeds, in degrees per second. This is treated as a magnitude.
Only use positive values. Argument 1 corresponds to wheel 1, etc.

    bot.angularSpeed(10, 20, 10);

    /* bad: negative numbers */
    /* bot.angularSpeed(-10, 10, 20) */

If you only pass one argument, LinkbotJS will use that speed for all the
wheels.

    /* same as bot.angularSpeed(10,10,10) */
    bot.angularSpeed(10);

<a id=move></a>
**move**
runs the wheels the specified number of degrees. The speed they move at is
controlled by <a href="#angSpeed">angularSpeed</a>. Positive values move
the wheel clockwise.

    bot.move(10, 0, -10);

<a id=stop></a>
**stop**
is an emergency stop!

    bot.stop();

<a id=disconnect></a>
**disconnect**
relinquishes control of the robot. It also invalidates the object it is
executed on. Let me know if that's weird.

    bot.disconnect();

### Linkbot Events

Linkbots can communicate with your code through event callbacks. Callbacks can
be
<a href='#register'>registered</a>
and
<a href='#unregister'>unregistered</a>, and will be invoked in a standard
way:

    /* Callback invocation */
    callback(robot, userData, event)

**TODO**: explain the parameters once the design settles down.

The <a href="#eventTypes">available event types</a> are listed below.

<a id="register"></a>
#### register

In lieu of complete documentation, here is an example of registering three
callbacks:

    bot.register({
      wheel: {
        /* When wheel 1 moves 20 degrees, run doStuff. Pass myData as 2nd
        argument to doStuff. */
        1: {
          distance: 20,
          callback: doStuff,
          data: myData
        },
        /* Run doOtherThings whenever wheel 2 moves at all. */
        2: {
          callback: doOtherThings
        }
      },
      button: {
        /* Run fireZeMissiles when button 3 is pressed. */
        3: {
            callback: fireZeMissiles
        }
      }
    })

<a id="unregister"></a>
#### unregister
*fixme: unimplemented*

<a id="eventTypes"></a>
#### Event types
The available events are:

<dl>
<a id="button"></a>
<dt>button</dt>
<dd>
The event object (the third argument to the callback) has form `{ buttonId(int) }`
</dd>
<a id="wheel"></a>
<dt>wheel</dt>
<dd>
The event object has form

    {
      triggerWheel(int), /* which wheel triggered the event? */
      timestamp(int),    /* when did the Linkbot fire the event? */
      positions([int])   /* wheel positions when the event fired */
    }

</dd>
</dl>


## Including the API in your code

Eventual support of require.js is planned, but for now, include linkbot.js
before your application code, and Linkbots will be available at the
global scope.
