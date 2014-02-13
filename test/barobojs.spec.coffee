describe "BaroboJS", ->

    it "has specified interface", ->
        methods = Object.getOwnPropertyNames(Barobo)
        expect(methods).toEqual(
            [ 'reactimate'
              'deactimate'
              'scan'
              'connect' ]

        )

    describe "testing setup", ->
        it "exposes internals", ->
            expect(actions).toBeDefined()
            expect(Linkbot).toBeDefined()

    describe "Linkbot", ->
        x = 0
        beforeEach(->
            x = new Linkbot(3)
        )
        it "has specified interface", ->
            methods = Object.getOwnPropertyNames(Linkbot.prototype)
            expect(methods).toEqual(
                [ 'constructor'
                  '_wheelRadius'
                  'color'
                  'angularSpeed'
                  'linearSpeed'
                  'move'
                  'stop'
                  'disconnect'
                ]
            )

        describe "angularSpeed", ->
            beforeEach ->
                spyOn(RobotBridge, 'angularSpeed')

            it "calls through to RobotBridge", ->
                x.angularSpeed(3)
                expect(RobotBridge.angularSpeed).toHaveBeenCalled()

            it "uses sole argument for all wheels", ->
                x.angularSpeed(4)
                expect(
                    RobotBridge.angularSpeed
                ).toHaveBeenCalledWith(x._id,4,4,4)

            it "uses all 3 arguments if supplied", ->
                x.angularSpeed(1,2,3)
                expect(
                    RobotBridge.angularSpeed
                ).toHaveBeenCalledWith(x._id,1,2,3)

        describe "linearSpeed", ->

            it "uses angularSpeed", ->
                spyOn(x, 'angularSpeed')
                x.linearSpeed(3 * x._wheelRadius)
                expect(x.angularSpeed).toHaveBeenCalledWith(3,3,3)

        describe "disconnect", ->
            it "nulls _id", ->
                x.disconnect()
                expect(x._id).toBeNull()

    describe "reactimate", ->
    describe "deactimate", ->
    describe "scan", ->
    describe "connect", ->
