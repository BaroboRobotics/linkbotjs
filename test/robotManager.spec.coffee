define(['robotManager'], (robotMgr) ->
    describe "RobotJS RobotManager", ->
        it "has specified interface", ->
            methods = Object.getOwnPropertyNames(robotMgr)
            expect(methods).toEqual(
                [ 'reactimate'
                  'deactimate'
                  'scan'
                  'connect' ]

            )

        describe "reactimate", ->
        describe "deactimate", ->
        describe "scan", ->
        describe "connect", ->
)
