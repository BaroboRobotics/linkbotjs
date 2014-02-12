# # BaroboJS API

# This API has four robot *management* methods: **deactimate**,
# **reactimate**, **scan**, and **connect**. That last one returns a
# Linkbot object, which has an additional number of robot *control*
# methods. I'll start by describing the Linkbot class. But first, a note on
# implementation details.
#
#
# ### A note on implementation details
#
# Underneath this library is a **BaroboBridge** object.  It is internal,
# implemented in C++, and is not to be trusted.
#
# Right, let's move on!

# ## Linkbot Class
#
# Linkbot control methods are **color**, **angularSpeed**,
# **linearSpeed**, **move**, **stop**, and **disconnect**. Right now
# they're just light wrappers over the internal RobotBridge object, but
# that should not be relied upon.

class Linkbot
    _wheelRadius: 1.75
    constructor: (@_id) ->

    # **color** sets the robot's LED color. Inputs are *r*, *g*, and *b*,
    # each 0–255.
    # ```
    # # Example: set the LED to red
    # # robot.color(255, 0, 0)
    # ```

    color: (r, g, b) -> RobotBridge.color(_id, r, g, b)

    # **angularSpeed** can do joints separately or all together. Speeds are
    # specified as radians per second.

    angularSpeed: (s1, s2, s3) ->
        if s2?
            RobotBridge.angularSpeed(_id, s1, s2, s3)
        else
            RobotBridge.angularSpeed(_id, s1, s1, s1)

    # **linearSpeed** speeds are specified as inches per second, and rely
    # on *_wheelRadius*.

    linearSpeed: (s1, s2, s3) ->
        angSpeeds = arguments.map((s) -> s / @_wheelRadius)
        @angularSpeed(angSpeeds...)

    # **move** tells the robot to move a number of radians. Clockwise is
    # positive.

    move: (r1, r2, r3) -> RobotBridge.move(_id, r1, r2, r3)

    # **stop** is an emergency stop!

    stop: -> RobotBridge.stop(_id)

    # **disconnect** nulls out the object, making it unusable. Let me know
    # if that's weird.

    disconnect: ->
        RobotBridge.disconnect(_id)
        _id = null

# ## Robot Management Methods

# Recall that there are four methods: **scan**, **connect**,
# **reactimate**, and **deactimate**.

# **scan** returns a list of ids.

scan = RobotBridge.scan

# **connect** is straightforward, though RobotBridge might throw something
# nasty.

connect = (id) ->
    RobotBridge.connect(id)
    new Linkbot(id)

# **reactimate** is a funny word that means, "Do certain things based on
# robot activity." Let's talk about this for a second.
#
# ### Aside: reactimate
#
# Here's a small example.
# ```
# robot = Barobo.connect(...)
# appData =
#   mine: 0
#   bobs: 0
#   myId = robot._id
#
# Barobo.reactimate({
#     button: (robotID, data, event) ->
#       if robotID == data.myID && event.button == 1
#         data.mine += 1
#       else
#         data.bobs += 1
#   }
#   appData
# )
# ```
# What's happening here is a callback is being registered for button
# events. The callback gets information on the robot that triggered the
# event, as well as the event itself. It also gets access to the value
# passed as the second argument to reactimate. This lets you write pure
# functions, hooray! That should let you play nicely with frameworks like
# Angular or Serenade.

# ### Reactimate connections
# These are the actions you can attach callbacks to.
robotActions = [ 'button', 'wheel' ]

# You've already seen an example of *button*. Here's a *wheel* example.
# ```
# # TODO: Wheel example
# ```

reactimate = (connections, model) ->
    if connections.button?
        if internal.buttonAction?
            RobotBridge.button.disconnect(internal.buttonAction)
        internal.buttonAction = (robID, btnID) ->
            connections.button(robID, model, { button: btnID })

        RobotBridge.button.connect(internal.buttonAction)

    if connections.wheel?
        if internal.wheelAction?
            RobotBridge.wheel.disconnect(internal.wheelAction)
        internal.wheelAction = (robID, wheelID, direction) ->
            internal.handleWheel(robID, wheelID, direction, model)

        RobotBridge.wheel.connect(internal.wheelAction)

# **deactimate** takes an Array of connections to stop caring about, and
# promptly stops caring about them.

deactimate = (connections) ->
    if connections['button']? && internal.wheelAction?
        RobotBridge.button.disconnect(internal.wheelAction)
        internal.buttonAction = null

    if connections['wheel']? && internal.wheelAction?
        RobotBridge.wheel.disconnect(internal.wheelAction)
        internal.wheelAction = null

# ## Integrating with BaroboLab

# ## Including the API in your code
#
# This module can be used by requirejs. In its absence, the module's
# methods can be accessed from the global Barobo object.
if define?
    define(
        reactimate: reactimate
        deactimate: deactimate
        scan: scan
        connect: connect
    )
else
    @Barobo =
        reactimate: reactimate
        deactimate: deactimate
        scan: scan
        connect: connect
