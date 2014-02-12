# BaroboJS API

class Linkbot
    _wheelRadius: 1.75
    constructor: (@_id) ->

    color: (r, g, b) -> RobotBridge.color(_id, r, g, b)

    angularSpeed: (s1, s2, s3) ->
        if s2?
            RobotBridge.angularSpeed(_id, s1, s2, s3)
        else
            RobotBridge.angularSpeed(_id, s1, s1, s1)

    linearSpeed: (s1, s2, s3) ->
        angSpeeds = arguments.map((s) -> s / @_wheelRadius)
        @angularSpeed(angSpeeds...)

    move: (r1, r2, r3) -> RobotBridge.move(_id, r1, r2, r3)

    stop: -> RobotBridge.stop(_id)

    # **disconnect** nulls out _id, making the object unusable. Let me know
    # if that's weird.
    disconnect: ->
        RobotBridge.disconnect(_id)
        _id = null

# Robot Management Methods

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

deactimate = (connections) ->
    if connections['button']? && internal.wheelAction?
        RobotBridge.button.disconnect(internal.wheelAction)
        internal.buttonAction = null

    if connections['wheel']? && internal.wheelAction?
        RobotBridge.wheel.disconnect(internal.wheelAction)
        internal.wheelAction = null

scan = RobotBridge.scan

connect = (id) ->
    RobotBridge.connect(id)
    new Linkbot(id)
