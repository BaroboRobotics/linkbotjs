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
            expect(baroboBridge).not.toBeNull()

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
                  'unregister'
                ]
            )

        it "sets _id with constructor", ->
            expect(x._id).toBe(3)

        describe "angularSpeed", ->
            it "calls through to baroboBridge", ->
                x.angularSpeed(3, 2, 1)
                expect(baroboBridge.angularSpeed)
                    .toHaveBeenCalledWith(x._id, 3, 2, 1)

            it "uses sole argument for all wheels", ->
                x.angularSpeed(4)
                expect(
                    baroboBridge.angularSpeed
                ).toHaveBeenCalledWith(x._id, 4,4,4)

        describe "disconnect", ->
            it "nulls _id", ->
                x.disconnect()
                expect(x._id).toBeNull()

        describe "register", ->
            robot = null
            model = {}
            beforeEach ->
                robot = new Linkbot(42)
                model = fuzz: "baz"

            it "button passes the model through"

            it "button lets the baroboBridge pass through events"

            it "wheel passes the model through"

            it "communicates the wheel index to the callback"
            it "keeps track of (Qt) connections, so they can be disconnected"

        describe "unregister", ->
            x = null

            beforeEach ->
                x = new Linkbot("fiz")

            it "doesn't care if nothing is registered", ->
                expect(x.unregister).not.toThrow()

            it "calls both (Qt) disconnect functions on baroboBridge", ->
                x.register(
                    wheel: 3: callback: (r, m, e) -> [r, m, e]
                )
                buttonDisconnectCallCount =
                    baroboBridge.buttonChanged.disconnect.calls.length
                wheelDisconnectCallCount =
                    baroboBridge.motorChanged.disconnect.calls.length

                x.unregister()

                expect(baroboBridge.motorChanged.disconnect.calls.length)
                    .toEqual(wheelDisconnectCallCount + 1)
                expect(baroboBridge.buttonChanged.disconnect.calls.length)
                    .toEqual(buttonDisconnectCallCount + 1)

            it "calls disables motor events", ->
                x.register(
                    wheel: 3: callback: (r, m, e) -> [r, m, e]
                )
                buttonDisconnectCallCount =
                    baroboBridge.disableButtonSignals.calls.length
                wheelDisconnectCallCount =
                    baroboBridge.disableMotorSignals.calls.length

                x.unregister()

                expect(baroboBridge.disableMotorSignals.calls.length)
                    .toEqual(wheelDisconnectCallCount + 1)
                expect(baroboBridge.disableButtonSignals.calls.length)
                    .toEqual(buttonDisconnectCallCount + 1)

    describe "scan", ->
        it "calls baroboBridge's scan", ->
            Linkbots.scan()
            expect(baroboBridge.scan).toHaveBeenCalled()

    describe "connect", ->
        it "calls baroboBridge's connectRobot", ->
            Linkbots.connect(0)
            expect(baroboBridge.connectRobot).toHaveBeenCalledWith(0)

        it "returns a Linkbot", ->
            r = Linkbots.connect(23)
            expect(r).toEqual(jasmine.any(Linkbot))
            expect(r._id).toBe(23)
