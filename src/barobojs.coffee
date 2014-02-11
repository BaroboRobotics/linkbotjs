# # BaroboJS API

# This API has four robot management methods: **connect**, **deactimate**,
# **reactimate**, and **scan**. **connect** returns a Robot object, which
# has an additional number of robot *control* methods. Let's start with
# describing it.

# ### Robot Class
#
# Robot control methods are: **id**, **color**, **angularSpeed**,
# **linearSpeed**, **move**, **stop**, and **disconnect**. Right now
# they're just light wrappers over the internal RobotBridge object, but
# that should not be relied upon.

class Robot
    _wheelRadius: 1.75

    # **id** needs no introduction.

    id: -> @_id

    # **color** sets the robot's LED color. Inputs are *r*, *g*, and *b*,
    # each 0–255.
    # ```
    # # Example: set the LED to red
    # # robot.color(255, 0, 0)
    # ```
    #

    color: (r, g, b) -> RobotBridge.color(@id(), r, g, b)

    # **angularSpeed** can do joints separately or all together. Speeds are
    # specified as radians per second.

    angularSpeed: (s1, s2, s3) ->
        if s2?
            RobotBridge.angularSpeed(@id(), s1, s2, s3)
        else
            RobotBridge.angularSpeed(@id(), s1, s1, s1)

    # **linearSpeed** speeds are specified as inches per second, and rely
    # on *_wheelRadius*.

    linearSpeed: (s1, s2, s3) ->
        angSpeeds = arguments.map((s) -> s / @_wheelRadius)
        @angularSpeed(angSpeeds...)

    # **move** tells the robot to move a number of radians. Clockwise is
    # positive.

    move: (r1, r2, r3) -> RobotBridge.move(@id(), r1, r2, r3)

    # **stop** is an emergency stop! It can safely be used as an event
    # callback thanks to the fat arrow.

    stop: => RobotBridge.stop(@id())

    # **disconnect** can also be used in a callback.

    disconnect: => RobotBridge.disconnect(@id())

# ### Robot Management Methods

reactimate = (connections, model) ->
deactimate = (connections) ->
scan = ->
connect = (id) ->

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
