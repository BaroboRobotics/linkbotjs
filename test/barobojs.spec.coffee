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
        model = {}
        beforeEach ->
            actions(
                button: []
                wheel: []
            )
            spyOn(RobotBridge.button, 'connect')
            spyOn(RobotBridge, 'wheelConnect')
            model = fuzz: "baz"

        it "button passes the model through", ->
            reactimate({
                button: (r, m, e) -> expect(m).toBe(model)
            }, model)
            expect(
                RobotBridge.button.connect
                ).toHaveBeenCalledWith(actions().button[0])
            actions().button[0]()

        it "button lets the Bridge pass through events", ->
            reactimate({
                button: (r, m, e) -> [r, e]
            })
            [rr, ee] = actions().button[0](1, 2)
            expect(rr).toBe(1)
            expect(ee.button).toBe(2)

        it "wheel can take a function", ->
            reactimate({
                wheel: (r, m, e) ->
            })
            expect(
                RobotBridge.wheelConnect
            ).toHaveBeenCalledWith(0, actions().wheel[0])

        it "wheel can take an object", ->
            reactimate({
                wheel: {
                    10: (r, m, e) ->
                    20: (r, m, e) ->
                }
            })
            expect(RobotBridge.wheelConnect.calls[0].args).toEqual(
                [10, actions().wheel[0]])
            expect(RobotBridge.wheelConnect.calls[1].args).toEqual(
                [20, actions().wheel[1]])

        it "wheel passes the model through", ->
            reactimate({
                wheel: (r, m, e) -> expect(m).toBe(model)
            }, model)
            reactimate({
                wheel: {
                    10: (r, m, e) -> expect(m).toBe(model)
                }
            }, model)
            actions().wheel[0]()
            actions().wheel[1]()

        it "wheel lets the Bridge pass through events", ->
            reactimate({
                wheel: (r, m, e) -> [r, e]
            })
            reactimate({
                wheel: {
                    10: (r, m, e) -> [r, e]
                }
            })
            [rr, ee] = actions().wheel[0](1, true, 0)
            expect(rr).toBe(1)
            expect(ee.clockwise).toBe(true)
            expect(ee.distance).toBe(0)

            [rr, ee] = actions().wheel[1](2,false, 10)
            expect(rr).toBe(2)
            expect(ee.clockwise).toBe(false)
            expect(ee.distance).toBe(10)

    describe "deactimate", ->
        beforeEach ->
            actions(
                button: []
                wheel: []
            )
            spyOn(RobotBridge.button, 'disconnect')
            spyOn(RobotBridge, 'wheelDisconnect')

        it "button cleans up the actions() register", ->
            actions().button.push(->)
            actions().button.push(->)
            deactimate(['button'])
            expect(actions().button).toEqual([])

        it "button disconnects the Bridge slot", ->
            actions().button.push(->)
            deactimate(['button'])
            expect(RobotBridge.button.disconnect).toHaveBeenCalled()
            expect(RobotBridge.wheelDisconnect).not.toHaveBeenCalled()

        it "deactimates buttons which are reactimated", ->
            reactimate({
                button: ->
            })
            deactimate(['button'])
            expect(actions().button).toEqual([])
            expect(RobotBridge.button.disconnect).toHaveBeenCalled()

        it "wheel cleans up the actions() register", ->
            actions().wheel.push(->)
            deactimate(['wheel'])
            expect(actions().wheel).toEqual([])


        it "wheel disconnects the Bridge slot", ->
            actions().wheel.push(->)
            deactimate(['wheel'])
            expect(RobotBridge.wheelDisconnect).toHaveBeenCalled()
            expect(RobotBridge.button.disconnect).not.toHaveBeenCalled()

        it "deactimates wheels which are reactimated", ->
            reactimate({
                wheel: (->)
            })
            deactimate(['wheel'])
            expect(actions().wheel).toEqual([])
            expect(RobotBridge.wheelDisconnect).toHaveBeenCalled()

    describe "scan", ->
    describe "connect", ->
