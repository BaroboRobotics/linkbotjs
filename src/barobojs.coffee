# BaroboJS API

class Robot
    _wheelRadius: 1.75

    id: -> @_id

    color: (r, g, b) -> RobotBridge.color(@id(), r, g, b)

    angularSpeed: (s1, s2, s3) ->
        if s2?
            RobotBridge.angularSpeed(@id(), s1, s2, s3)
        else
            RobotBridge.angularSpeed(@id(), s1, s1, s1)

    linearSpeed: (s1, s2, s3) ->
        angSpeeds = arguments.map((s) -> s / @_wheelRadius)
        @angularSpeed(angSpeeds...)

    move: (r1, r2, r3) -> RobotBridge.move(@id(), r1, r2, r3)

    stop: => RobotBridge.stop(@id())

    disconnect: => RobotBridge.disconnect(@id())

# Robot Management Methods

reactimate = (connections, model) ->
deactimate = (connections) ->
scan = ->
connect = (id) ->
