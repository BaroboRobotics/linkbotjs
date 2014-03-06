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
                spyOn(BaroboBridge, 'angularSpeed')

            it "calls through to BaroboBridge", ->
                x.angularSpeed(3)
                expect(BaroboBridge.angularSpeed).toHaveBeenCalled()

            it "uses sole argument for all wheels", ->
                x.angularSpeed(4)
                expect(
                    BaroboBridge.angularSpeed
                ).toHaveBeenCalledWith(x._id,4,4,4)

            it "uses all 3 arguments if supplied", ->
                x.angularSpeed(1,2,3)
                expect(
                    BaroboBridge.angularSpeed
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
            robot = null
            model = {}
            beforeEach ->
                robot = new Linkbot(42)
                actions(
                    button: []
                    wheel: []
                )
                spyOn(BaroboBridge.button, 'connect')
                spyOn(BaroboBridge, 'wheelConnect')
                model = fuzz: "baz"

            it "button passes the model through", ->
                robot.reactimate({
                    button: (r, m, e) -> expect(m).toBe(model)
                }, model)
                expect(
                    BaroboBridge.button.connect
                    ).toHaveBeenCalledWith(42, actions().button[0])
                actions().button[0]()

            it "button lets the BaroboBridge pass through events", ->
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
                    BaroboBridge.wheelConnect
                ).toHaveBeenCalledWith(42, 0, actions().wheel[0])

            it "wheel can take an object", ->
                robot.reactimate({
                    wheel: {
                        10: (r, m, e) ->
                        20: (r, m, e) ->
                    }
                })
                expect(BaroboBridge.wheelConnect.calls[0].args).toEqual(
                    [42, 10, actions().wheel[0]])
                expect(BaroboBridge.wheelConnect.calls[1].args).toEqual(
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

            it "wheel lets the BaroboBridge pass through events", ->
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
                spyOn(BaroboBridge.button, 'disconnect')
                spyOn(BaroboBridge, 'wheelDisconnect')

            it "button cleans up the actions() register", ->
                actions().button.push(->)
                actions().button.push(->)
                robot.deactimate(['button'])
                expect(actions().button).toEqual([])

            it "button disconnects the BaroboBridge slot", ->
                actions().button.push(->)
                robot.deactimate(['button'])
                expect(BaroboBridge.button.disconnect).toHaveBeenCalled()
                expect(BaroboBridge.wheelDisconnect).not.toHaveBeenCalled()

            it "deactimates buttons which are reactimated", ->
                robot.reactimate({
                    button: ->
                })
                robot.deactimate(['button'])
                expect(actions().button).toEqual([])
                expect(BaroboBridge.button.disconnect).toHaveBeenCalled()

            it "wheel cleans up the actions() register", ->
                actions().wheel.push(->)
                robot.deactimate(['wheel'])
                expect(actions().wheel).toEqual([])


            it "wheel disconnects the BaroboBridge slot", ->
                actions().wheel.push(->)
                robot.deactimate(['wheel'])
                expect(BaroboBridge.wheelDisconnect).toHaveBeenCalled()
                expect(BaroboBridge.button.disconnect).not.toHaveBeenCalled()

            it "deactimates wheels which are reactimated", ->
                robot.reactimate({
                    wheel: (->)
                })
                robot.deactimate(['wheel'])
                expect(actions().wheel).toEqual([])
                expect(BaroboBridge.wheelDisconnect).toHaveBeenCalled()

    describe "scan", ->
        it "calls BaroboBridge's scan", ->
            spyOn(BaroboBridge, "scan")
            scan()
            expect(BaroboBridge.scan).toHaveBeenCalled()

    describe "connect", ->
        beforeEach ->
            spyOn(BaroboBridge, "connect")

        it "calls BaroboBridge's connect", ->
            connect(0)
            expect(BaroboBridge.connect).toHaveBeenCalledWith(0)

        it "returns a Linkbot", ->
            r = connect(23)
            expect(r).toEqual(jasmine.any(Linkbot))
            expect(r._id).toBe(23)
