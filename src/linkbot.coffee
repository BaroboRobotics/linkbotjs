# BaroboJS API

baroboBridge = (if @baroboBridge? then @baroboBridge else {})
(baroboBridge[m] ?= ->) for m in [
    'angularSpeed'
    'disconnect'
    'linearSpeed'
    'move'
    'stop'
    'wheelConnect'
    'wheelDisconnect'
    'scan'
    'connectRobot'
    'setLEDColor'
]
baroboBridge.button ?= {}
baroboBridge.button.connect ?= ->
baroboBridge.button.disconnect ?= ->

# baroboBridge uses degrees!
rad2deg = (r) ->
    r * 180 / Math.PI

class Linkbot
    _wheelRadius: 1.75
    constructor: (@_id) ->

    color: (r, g, b) -> baroboBridge.setLEDColor(@_id, r, g, b)

    angularSpeed: (s1, s2 = s1, s3 = s1) ->

        s1 = rad2deg s1
        s2 = rad2deg s2
        s3 = rad2deg s3
        baroboBridge.angularSpeed(@_id, s1, s2, s3)

    linearSpeed: (s1, s2 = s1, s3 = s1) ->
        [l1, l2, l3] = (s / @_wheelRadius for s in [s1, s2, s3])
        @angularSpeed(l1, l2, l3)

    move: (r1, r2, r3) ->
        r1 = rad2deg r1
        r2 = rad2deg r2
        r3 = rad2deg r3
        baroboBridge.move(@_id, r1, r2, r3)

    stop: -> baroboBridge.stop(@_id)

    # **disconnect** nulls out @_id, making the object unusable. Let me know
    # if that's weird.
    disconnect: ->
        baroboBridge.disconnect(@_id)
        @_id = null

    reactimate: (connections, model = {}) ->
        if connections.button?
            act = buttonAction(connections.button, model)
            baroboBridge.button.connect(@_id, act)
            actions().button.push(act)

        if connections.wheel?
            if typeof(connections.wheel) == "function"
                act = wheelAction(connections.wheel, model)
                baroboBridge.wheelConnect(@_id, 0, act)
                actions().wheel.push(act)
            else
                for own distance, callback of connections.wheel
                    act = wheelAction(callback, model)
                    baroboBridge.wheelConnect(@_id, parseInt(distance), act)
                    actions().wheel.push(act)

    deactimate: (connections) ->
        if connections.indexOf('button') >=0
            baroboBridge.button.disconnect(@_id, act) for act in actions().button
            actions().button = []

        if connections.indexOf('wheel') >= 0
            baroboBridge.wheelDisconnect(@_id, act) for act in actions().wheel
            actions().wheel = []


# Robot Management Methods

actions = (meh) ->
    actions.actions = meh if meh?
    actions.actions

actions(
    button: []
    wheel: []
)

# These actions wrap the slot registered with the Bridge's signal, bringing
# it back to javascript land.
buttonAction = (callback, model) ->
    (robID, btnID) -> callback(robID, model, { button: btnID })

wheelAction = (callback, model) ->
    (robID, clockwise, distance) ->
        callback(robID, model, {
            clockwise: clockwise
            distance: distance
        })

@Linkbots =
    scan: -> baroboBridge.scan()

    connect: (id) ->
        baroboBridge.connectRobot(id)
        new Linkbot(id)
