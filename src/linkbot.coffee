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

class Linkbot
    _wheelRadius: 1.75
    constructor: (@_id) ->
        baroboBridge.connectRobot(@_id)
        for m in [0 .. 2]
            baroboBridge.setMotorEventThreshold(@_id, m, 1e10)
        @wheelPositions = baroboBridge.getMotorAngles(@_id)

    color: (r, g, b) -> baroboBridge.setLEDColor(@_id, r, g, b)

    angularSpeed: (s1, s2 = s1, s3 = s1) ->

        baroboBridge.angularSpeed(@_id, s1, s2, s3)

    move: (r1, r2, r3) ->
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
                act = buttonAction(@, parseInt(buttonId), registerObject.callback, registerObject.data)
                baroboBridge.buttonChanged.connect(act)
                baroboBridge.enableButtonSignals(@_id)

        if connections.wheel?
            for own _wheelId, registerObject of connections.wheel
                wheelId = parseInt(_wheelId)
                act = wheelAction(@, wheelId, registerObject.callback, registerObject.data)
                baroboBridge.setMotorEventThreshold(@_id, wheelId, registerObject.distance)
                baroboBridge.motorChanged.connect(act)
                baroboBridge.enableMotorSignals(@_id)

# Robot Management Methods

# These actions wrap the slot registered with the Bridge's signal, bringing
# it back to javascript land.
buttonAction = (robot, buttonId, callback, model = {}) ->
    (robID, btnID, press) ->
        if press == 1 and robot._id == robID and buttonId == btnID
            callback(robot, model, { button: btnID })

wheelAction = (robot, wheelId, callback, model = {}) ->
    (robID, _wheelId, angle) ->
        if robot._id == robID and wheelId == _wheelId
            callback(robID, model, {
                triggerWheel: wheelId
                position: angle
                difference: wheelPositions[wheelId - 1] - angle
            })
            wheelPositions[wheelId - 1] = angle

@Linkbots =
    scan: -> baroboBridge.scan()

    connect: (id) ->
        new Linkbot(id)
