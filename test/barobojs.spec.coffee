describe "RobotJS RobotManager", ->
    describe "testing setup", ->
        it "exposes actions", ->
            expect(actions).toBeDefined()

    it "has specified interface", ->
        methods = Object.getOwnPropertyNames(Barobo)
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
