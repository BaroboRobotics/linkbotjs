describe "LinkbotJS", ->

    it "has specified interface", ->
        methods = Object.getOwnPropertyNames(Linkbots)
        expect(methods).toEqual(
            [ 'scan'
              'connect'
            ]

        )

    describe "testing setup", ->
        it "exposes internals", ->
            expect(Linkbot).toBeDefined()
            expect(baroboBridge).not.toBeNull()

    describe "Linkbot", ->
        lb = 0
        beforeEach(->
            lb = new Linkbot(3)
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
            expect(lb._id).toBe(3)

        describe "angularSpeed", ->
            it "calls through to baroboBridge", ->
                lb.angularSpeed(3, 2, 1)
                expect(baroboBridge.angularSpeed)
                    .toHaveBeenCalledWith(lb._id, 3, 2, 1)

            it "uses sole argument for all wheels", ->
                lb.angularSpeed(4)
                expect(
                    baroboBridge.angularSpeed
                ).toHaveBeenCalledWith(lb._id, 4,4,4)

        describe "disconnect", ->
            it "nulls _id", ->
                lb.disconnect()
                expect(lb._id).toBeNull()

            it "stops the robot", ->
                spyOn(lb, "stop")
                lb.disconnect()
                expect(lb.stop).toHaveBeenCalled()

        describe "register", ->
            robot = null
            model = {}

            beforeEach ->
                robot = new Linkbot(42)
                model = fuzz: "baz"

            afterEach ->
                baroboBridge.motorChanged.connect.and.stub()
                robot.unregister()

            describe "button", ->
                registerObj = 0

                beforeEach ->
                    # This fakes the Qt signal, calling the slot as soon as
                    # it's registered
                    baroboBridge.buttonChanged.connect
                        .and.callFake((slot) -> slot(42, 1, 1))

                    registerObj =
                        button:
                            1:
                                callback: (r, m, e) ->
                                data: model
                            2:
                                callback: (r, m, e) ->
                                data: model

                afterEach ->
                    baroboBridge.buttonChanged.connect.and.stub()

                it "calls the callback when a Qt signal fires", ->
                    spyOn(registerObj.button['1'],'callback').and.callThrough()
                    robot.register(registerObj)
                    expect(baroboBridge.buttonChanged.connect).toHaveBeenCalled()
                    expect(registerObj.button['1'].callback)
                        .toHaveBeenCalledWith(robot, model, {button: 1})

                it "only calls the right callback", ->
                    # Fake Qt signal uses button 2, so this shouldn't
                    # happen
                    spyOn(registerObj.button['2'],'callback').and.callThrough()
                    robot.register(registerObj)
                    expect(registerObj.button['2'].callback)
                        .not.toHaveBeenCalled()

                    # Also only uses robot with id 42, so:
                    lb = Linkbots.connect(18)
                    spyOn(registerObj.button['1'],'callback').and.callThrough()
                    lb.register(registerObj)
                    expect(registerObj.button['1'].callback)
                        .not.toHaveBeenCalled()

            describe "wheel", ->
                it "calls the callback when a Qt signal fires", ->
                    # This fakes the Qt signal, calling the slot as soon as it's
                    # registered
                    baroboBridge.motorChanged.connect.and.callFake((slot) -> slot(42, 2, 30))

                    registerObj =
                        wheel:
                            2:
                                callback: (r, m, e) ->
                                data: model
                                distance: 10

                    spyOn(registerObj.wheel['2'],'callback').and.callThrough()
                    robot.register(registerObj)
                    expect(baroboBridge.motorChanged.connect).toHaveBeenCalled()
                    expect(registerObj.wheel['2'].callback)
                        .toHaveBeenCalledWith(
                            robot
                            model
                            {
                                triggerWheel: 2
                                position: 30
                                difference: 30
                            }
                        )

            it "keeps track of (Qt) connections, so they can be disconnected"

            describe "wheelSlot", ->
                it "returns accurate data" # wheelId, position, difference

            describe "buttonSlot", ->
                it "returns accurate data" # btnId

        describe "unregister", ->
            it "doesn't care if nothing is registered", ->
                expect(lb.unregister).not.toThrow()

            it "calls both (Qt) disconnect functions on baroboBridge", ->
                lb.register(
                    wheel: 3: callback: (r, m, e) -> [r, m, e]
                )
                baroboBridge.buttonChanged.disconnect.calls.reset()
                baroboBridge.motorChanged.disconnect.calls.reset()

                lb.unregister()

                expect(baroboBridge.buttonChanged.disconnect.calls.any())
                    .toBe(true)
                expect(baroboBridge.buttonChanged.disconnect.calls.any())
                    .toBe(true)

            it "calls disables motor events", ->
                lb.register(
                    wheel: 3: callback: (r, m, e) -> [r, m, e]
                )
                baroboBridge.disableButtonSignals.calls.reset()
                baroboBridge.disableMotorSignals.calls.reset()

                lb.unregister()

                expect(baroboBridge.disableMotorSignals.calls.any())
                    .toBe(true)
                expect(baroboBridge.disableButtonSignals.calls.any())
                    .toBe(true)

    describe "scan", ->
        it "calls baroboBridge's scan", ->
            Linkbots.scan()
            expect(baroboBridge.scan).toHaveBeenCalled()

    describe "connect", ->
        it "hecka barfs when the robot's firmware is not blessed"


        it "calls baroboBridge's connectRobot", ->
            Linkbots.connect(0)
            expect(baroboBridge.connectRobot).toHaveBeenCalledWith(0)

        it "returns a Linkbot", ->
            r = Linkbots.connect(23)
            expect(r).toEqual(jasmine.any(Linkbot))

        it "sets instance vars", ->
            r = Linkbots.connect(23)
            expect(r._id).toBeDefined()
            expect(r._firmwareVersion).toBeDefined()
            expect(r._wheelPositions).toBeDefined()
