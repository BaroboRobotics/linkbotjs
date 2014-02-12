# BaroboJS API

@Barobo =
    reactimate: reactimate
    deactimate: deactimate
    scan: scan
    connect: connect

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

actions =
    button: []
    wheel: []

buttonAction = (callback) ->
    (robID, btnID) -> callback(robID, model, { button: btnID })

wheelAction = (callback) ->
    (robID, direction) ->
        callback(robID, model, { clockwise: (direction == 1) })

reactimate = (connections, model) ->

    if connections.button?
        act = buttonAction(connections.button)
        RobotBridge.button.connect(act)
        actions.button.push(act)

    if connections.wheel?
        if typeof(connections.wheel) == "function"
            act = wheelAction(connections.wheel)
            RobotBridge.wheelConnect(0, act)
            actions.wheel.push(act)
        else
            for own distance, callback of connections.wheel
                act = wheelAction(callback)
                RobotBridge.wheelConnect(distance, act)
                actions.wheel.push(act)

deactimate = (connections) ->
    if connections['button']?
        RobotBridge.button.disconnect(act) for act in actions.button
        actions.button = []

    if connections['wheel']?
        RobotBridge.wheelDisconnect(act) for act in actions.wheel
        actions.wheel = []

scan = RobotBridge?.scan

connect = (id) ->
    RobotBridge.connect(id)
    new Linkbot(id)
