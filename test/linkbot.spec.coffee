describe "LinkbotJS", ->

    it "has specified interface", ->
        methods = Object.getOwnPropertyNames(Linkbots)
        expect(methods).toEqual(
            [ 'scan'
              'connect' ]

        )

    describe "testing setup", ->
        it "exposes internals", ->
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
                  'move'
                  'stop'
                  'disconnect'
                  'register'
                ]
            )

        it "sets _id with constructor", ->
            expect(x._id).toBe(3)

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

        describe "disconnect", ->
            it "nulls _id", ->
                x.disconnect()
                expect(x._id).toBeNull()

        xdescribe "register", ->
            robot = null
            model = {}
            beforeEach ->
                robot = new Linkbot(42)
                spyOn(baroboBridge.buttonChanged, 'connect')
                spyOn(baroboBridge.motorChanged, 'connect')
                model = fuzz: "baz"

            it "button passes the model through", ->
                robot.register(
                    button:
                        1:
                            callback: (r, m, e) -> expect(m).toBe(model)
                            data: model
                )
                expect(
                    baroboBridge.buttonChanged.connect
                    ).toHaveBeenCalledWith(42, actions().button[0])
                actions().button[0]()

            it "button lets the baroboBridge pass through events", ->
                robot.register(
                    button:
                        1:
                            callback: (r, m, e) -> [r, e]
                )
                [rr, ee] = actions().button[0](robot, 2)
                expect(rr).toBe(robot)
                expect(ee.button).toBe(2)

            it "wheel passes the model through", ->
                robot.register(
                    wheel:
                        1:
                            callback: (r, m, e) -> expect(m).toBe(model)
                            data: model
                )
                actions().wheel[0]()

            it "communicates the wheel index to the callback", ->
                robot.register(
                    wheel:
                        1:
                            callback: (r, m, e) -> expect(e.triggerWheel).toBe(1)
                )
                actions().wheel[0]()

    #describe "scan", ->
    #    it "calls baroboBridge's scan", ->
    #        spyOn(baroboBridge, "scan")
    #        Linkbots.scan()
    #        expect(baroboBridge.scan).toHaveBeenCalled()

    describe "connect", ->
        beforeEach ->
            spyOn(baroboBridge, "connectRobot")

        it "calls baroboBridge's connectRobot", ->
            Linkbots.connect(0)
            expect(baroboBridge.connectRobot).toHaveBeenCalledWith(0)

        it "returns a Linkbot", ->
            r = Linkbots.connect(23)
            expect(r).toEqual(jasmine.any(Linkbot))
            expect(r._id).toBe(23)
