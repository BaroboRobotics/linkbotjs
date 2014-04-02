describe "LinkbotJS", ->

    it "has specified interface", ->
        methods = Object.getOwnPropertyNames(Linkbots)
        expect(methods).toEqual(
            [ 'scan'
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
                  'reactimate'
                  'deactimate'
                ]
            )

        describe "angularSpeed", ->
            beforeEach ->
                spyOn(baroboBridge, 'angularSpeed')

            it "calls through to baroboBridge", ->
                x.angularSpeed(3)
                expect(baroboBridge.angularSpeed).toHaveBeenCalled()

            it "converts radians to degrees", ->
                x.angularSpeed(3,2,1)
                r1 = rad2deg(3)
                r2 = rad2deg(2)
                r3 = rad2deg(1)
                expect(baroboBridge.angularSpeed).toHaveBeenCalledWith(x._id, r1, r2, r3)

            it "uses sole argument for all wheels", ->
                x.angularSpeed(4)
                r1 = rad2deg(4)
                expect(
                    baroboBridge.angularSpeed
                ).toHaveBeenCalledWith(x._id, r1, r1, r1)

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
            robot = null
            model = {}
            beforeEach ->
                robot = new Linkbot(42)
                actions(
                    button: []
                    wheel: []
                )
                spyOn(baroboBridge.button, 'connect')
                spyOn(baroboBridge, 'wheelConnect')
                model = fuzz: "baz"

            it "button passes the model through", ->
                robot.reactimate({
                    button: (r, m, e) -> expect(m).toBe(model)
                }, model)
                expect(
                    baroboBridge.button.connect
                    ).toHaveBeenCalledWith(42, actions().button[0])
                actions().button[0]()

            it "button lets the baroboBridge pass through events", ->
                robot.reactimate({
                    button: (r, m, e) -> [r, e]
                })
                [rr, ee] = actions().button[0](1, 2)
                expect(rr).toBe(1)
                expect(ee.button).toBe(2)

            it "wheel can take a function", ->
                robot.reactimate({
                    wheel: (r, m, e) ->
                })
                expect(
                    baroboBridge.wheelConnect
                ).toHaveBeenCalledWith(42, 0, actions().wheel[0])

            it "wheel can take an object", ->
                robot.reactimate({
                    wheel: {
                        10: (r, m, e) ->
                        20: (r, m, e) ->
                    }
                })
                expect(baroboBridge.wheelConnect.calls[0].args).toEqual(
                    [42, 10, actions().wheel[0]])
                expect(baroboBridge.wheelConnect.calls[1].args).toEqual(
                    [42, 20, actions().wheel[1]])

            it "wheel passes the model through", ->
                robot.reactimate({
                    wheel: (r, m, e) -> expect(m).toBe(model)
                }, model)
                robot.reactimate({
                    wheel: {
                        10: (r, m, e) -> expect(m).toBe(model)
                    }
                }, model)
                actions().wheel[0]()
                actions().wheel[1]()

            it "wheel lets the baroboBridge pass through events", ->
                robot.reactimate({
                    wheel: (r, m, e) -> [r, e]
                })
                robot.reactimate({
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
            robot = null
            beforeEach ->
                robot = new Linkbot(42)
                actions(
                    button: []
                    wheel: []
                )
                spyOn(baroboBridge.button, 'disconnect')
                spyOn(baroboBridge, 'wheelDisconnect')

            it "button cleans up the actions() register", ->
                actions().button.push(->)
                actions().button.push(->)
                robot.deactimate(['button'])
                expect(actions().button).toEqual([])

            it "button disconnects the baroboBridge slot", ->
                actions().button.push(->)
                robot.deactimate(['button'])
                expect(baroboBridge.button.disconnect).toHaveBeenCalled()
                expect(baroboBridge.wheelDisconnect).not.toHaveBeenCalled()

            it "deactimates buttons which are reactimated", ->
                robot.reactimate({
                    button: ->
                })
                robot.deactimate(['button'])
                expect(actions().button).toEqual([])
                expect(baroboBridge.button.disconnect).toHaveBeenCalled()

            it "wheel cleans up the actions() register", ->
                actions().wheel.push(->)
                robot.deactimate(['wheel'])
                expect(actions().wheel).toEqual([])


            it "wheel disconnects the baroboBridge slot", ->
                actions().wheel.push(->)
                robot.deactimate(['wheel'])
                expect(baroboBridge.wheelDisconnect).toHaveBeenCalled()
                expect(baroboBridge.button.disconnect).not.toHaveBeenCalled()

            it "deactimates wheels which are reactimated", ->
                robot.reactimate({
                    wheel: (->)
                })
                robot.deactimate(['wheel'])
                expect(actions().wheel).toEqual([])
                expect(baroboBridge.wheelDisconnect).toHaveBeenCalled()

    describe "scan", ->
        it "calls baroboBridge's scan", ->
            spyOn(baroboBridge, "scan")
            Linkbots.scan()
            expect(baroboBridge.scan).toHaveBeenCalled()

    describe "connect", ->
        beforeEach ->
            spyOn(baroboBridge, "connectRobot")

        it "calls baroboBridge's connect", ->
            Linkbots.connect(0)
            expect(baroboBridge.connectRobot).toHaveBeenCalledWith(0)

        it "returns a Linkbot", ->
            r = Linkbots.connect(23)
            expect(r).toEqual(jasmine.any(Linkbot))
            expect(r._id).toBe(23)
