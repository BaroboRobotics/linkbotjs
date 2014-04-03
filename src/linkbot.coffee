# BaroboJS API

baroboBridge = if @baroboBridge?
    @baroboBridge
else
    {
        # member functions
        angularSpeed: ->
        beginScan: ->
        connectRobot: ->
        disableAccelSignals: ->
        disableButtonSignals: ->
        disableMotorSignals: ->
        disconnectRobot: ->
        enableAccelSignals: ->
        enableButtonSignals: ->
        enableMotorSignals: ->
        fetch: ->
        move: ->
        numConnectedRobots: ->
        setLEDColor: ->
        setMotorEventThreshold: ->
        stop: ->
        # signals
        buttonChanged:
            connect: ->
            disconnect: ->
        motorsChanged:
            connect: ->
            disconnect: ->
        motorChanged:
            connect: ->
            disconnect: ->
        accelChanged:
            connect: ->
            disconnect: ->
        idScanned:
            connect: ->
            disconnect: ->
        fetchFinished:
            connect: ->
            disconnect: ->
    }

# baroboBridge uses degrees!
rad2deg = (r) ->
    r * 180 / Math.PI

deg2rad = (d) ->
    d * Math.PI / 180

class Linkbot
    _wheelRadius: 1.75
    constructor: (@_id) ->

    color: (r, g, b) -> baroboBridge.setLEDColor(@_id, r, g, b)

    angularSpeed: (s1, s2 = s1, s3 = s1) ->

        s1 = rad2deg s1
        s2 = rad2deg s2
        s3 = rad2deg s3
        baroboBridge.angularSpeed(@_id, s1, s2, s3)

    move: (r1, r2, r3) ->
        r1 = rad2deg r1
        r2 = rad2deg r2
        r3 = rad2deg r3
        baroboBridge.move(@_id, r1, r2, r3)

    stop: -> baroboBridge.stop(@_id)

    # **disconnect** nulls out @_id, making the object unusable. Let me know
    # if that's weird.
    disconnect: ->
        baroboBridge.disconnectRobot(@_id)
        @_id = null

    register: (connections, model = {}) ->
        if connections.button?
            for own buttonId, registerObject of connections.button
                act = buttonAction(@, buttonId, registerObject.callback, registerObject.data)
                baroboBridge.buttonChanged.connect(act)
                baroboBridge.enableButtonSignals(@_id)

        if connections.wheel?
            for own wheelId, registerObject of connections.wheel
                act = wheelAction(@, wheelId, registerObject.callback, registerObject.data)
                baroboBridge.setMotorEventThreshold(@_id, wheelId, rad2deg(registerObject.distance))
                baroboBridge.motorChanged.connect(act)
                baroboBridge.enableMotorSignals(@_id)

# Robot Management Methods

# These actions wrap the slot registered with the Bridge's signal, bringing
# it back to javascript land.
buttonAction = (robot, buttonId, callback, model = {}) ->
    (robID, btnID) ->
        if robot._id == robID and buttonId == btnID
            callback(robot, model, { button: btnID })

wheelAction = (robot, wheelId, callback, model = {}) ->
    (robID, _wheelId, angle) ->
        if robot._id == robID and wheelId == _wheelId
            callback(robID, model, {
                triggerWheel: wheelId
                position: deg2rad(angle)
            })

@Linkbots =
    scan: -> baroboBridge.scan()

    connect: (id) ->
        baroboBridge.connectRobot(id)
        new Linkbot(id)
