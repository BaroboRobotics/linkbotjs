# BaroboJS API

BaroboBridge = (if BaroboBridge? then BaroboBridge else {})
(BaroboBridge[m] ?= ->) for m in [
    'angularSpeed'
    'disconnect'
    'linearSpeed'
    'move'
    'stop'
    'wheelConnect'
    'wheelDisconnect'
    'scan'
    'connect'
]
BaroboBridge.button ?= {}
BaroboBridge.button.connect ?= ->
BaroboBridge.button.disconnect ?= ->

@Linkbots =
    reactimate: reactimate
    deactimate: deactimate
    scan: scan
    connect: connect

class Linkbot
    _wheelRadius: 1.75
    constructor: (@_id) ->

    color: (r, g, b) -> BaroboBridge.color(@_id, r, g, b)

    angularSpeed: (s1, s2 = s1, s3 = s1) ->
        BaroboBridge.angularSpeed(@_id, s1, s2, s3)

    linearSpeed: (s1, s2 = s1, s3 = s1) ->
        [l1, l2, l3] = (s / @_wheelRadius for s in [s1, s2, s3])
        @angularSpeed(l1, l2, l3)

    move: (r1, r2, r3) -> BaroboBridge.move(@_id, r1, r2, r3)

    stop: -> BaroboBridge.stop(@_id)

    # **disconnect** nulls out @_id, making the object unusable. Let me know
    # if that's weird.
    disconnect: ->
        BaroboBridge.disconnect(@_id)
        @_id = null

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

reactimate = (connections, model = {}) ->

    if connections.button?
        act = buttonAction(connections.button, model)
        BaroboBridge.button.connect(act)
        actions().button.push(act)

    if connections.wheel?
        if typeof(connections.wheel) == "function"
            act = wheelAction(connections.wheel, model)
            BaroboBridge.wheelConnect(0, act)
            actions().wheel.push(act)
        else
            for own distance, callback of connections.wheel
                act = wheelAction(callback, model)
                BaroboBridge.wheelConnect(parseInt(distance), act)
                actions().wheel.push(act)

deactimate = (connections) ->
    if connections.indexOf('button') >=0
        BaroboBridge.button.disconnect(act) for act in actions().button
        actions().button = []

    if connections.indexOf('wheel') >= 0
        BaroboBridge.wheelDisconnect(act) for act in actions().wheel
        actions().wheel = []

scan = -> BaroboBridge.scan()

connect = (id) ->
    BaroboBridge.connect(id)
    new Linkbot(id)
