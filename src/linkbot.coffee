# LinkbotJS API

# The API for LinkbotJS is found in two parts. The first, and largest, is
# the Linkbot class, which manages a single Linkbot. The second is the
# Linkbots object, with is the global 'library' object (like $ for JQuery).
#
# LinkbotJS also sets up a dummy baroboBridge, so the library doesn't throw
# lots of errors on non-barobo browsers. It obviously won't communicate
# with robots on those browsers, but at least apps won't crash and die.

#
# RobotManager class
#
# Handles the internal logic of the manager widget
#
class RobotManager
  constructor: (document) ->
    @robots = []
    @element = document.createElement('div')
    @element.innerHTML =
      '<form>' +
        '<div>' +
          '<label for="roboInput">' +
            'Linkbot ID' +
          '</label>' +
          '<input type="text" placeholder="Linkbot ID">' +
        '</div>' +
        '<button>+</button>' +
      '</form>' +
      '<ol></ol>'

  acquire: (n) ->
    readyBots = @robots.filter((r) -> r.status == "ready")

    ret =
      robots: []
      registered: @robots.length
      ready: readyBots.length

    if ret.ready >= n
      rs = readyBots[0...2]
      rs.map((r) -> r.status = "acquired")
      ret.robots = rs.map((r) -> r.linkbot)
      ret.ready -= 2

    ret

  add: (id) ->
    if @robots.map((x) -> x.id).indexOf(id) < 0
      @robots.push
        status: "new"
        id: id

  relinquish: (bot) ->
    idx = @robots.map((x) -> x.id).indexOf(bot._id)
    if idx >= 0 && @robots[idx].status == "acquired"
      @robots[idx].status = "ready"

#
# "Module" object, exposed globally.
#
@Linkbots = ((doc)->
  # Private stuff
  manager = new RobotManager(doc)

  # Public interface
  {
    scan: -> baroboBridge.scan()

    managerElement: ->
      manager.element()

    acquire: (n) ->
      manager.acquire(n)
  }
)(@document)

#
# Linkbot class, accessed through Linkbots.connect.
#
class Linkbot
  _wheelRadius: 1.75
  constructor: (@_id) ->
    err = baroboBridge.connectRobot(@_id)
    throw "Linkbot connection failed. id: #{@_id}" if err < 0

    for m in [1..3]
      baroboBridge.setMotorEventThreshold(@_id, m, 1e10)
    @_wheelPositions = baroboBridge.getMotorAngles(@_id)
    @_firmwareVersion = baroboBridge.firmwareVersion(@_id)
    if ! baroboBridge.mock
      blessedFW = baroboBridge.availableFirmwareVersions()
      # This only exists until the UI component of LinkbotJS has a robot
      # manager that apps can use.
      if blessedFW.indexOf(@_firmwareVersion) < 0
        idAsURI = encodeURIComponent(@_id)
        @disconnect()
        document.location = ("../LinkbotUpdate/index.html?badRobot=#{idAsURI}")

  color: (r, g, b) -> baroboBridge.setLEDColor(@_id, r, g, b)

  angularSpeed: (s1, s2 = s1, s3 = s1) ->

    baroboBridge.angularSpeed(@_id, s1, s2, s3)

  move: (r1, r2, r3) ->
    baroboBridge.move(@_id, r1, r2, r3)

  moveTo: (r1, r2, r3) ->
    baroboBridge.moveTo(@_id, r1, r2, r3)

  wheelPositions: ->
    @_wheelPositions = baroboBridge.getMotorAngles(@_id)

  stop: -> baroboBridge.stop(@_id)

  buzzerFrequency: (freq) -> baroboBridge.buzzerFrequency(@_id, freq)

  # **disconnect** nulls out @_id, making the object unusable. Let me know
  # if that's weird.
  disconnect: ->
    @stop()
    baroboBridge.disconnectRobot(@_id)
    @_id = null

  register: (connections) ->
    if connections.button?
      for own buttonId, registerObject of connections.button
        slot = buttonSlot(@, parseInt(buttonId), registerObject.callback, registerObject.data)
        baroboBridge.buttonChanged.connect(slot)
        baroboBridge.enableButtonSignals(@_id)

    if connections.wheel?
      for own _wheelId, registerObject of connections.wheel
        wheelId = parseInt(_wheelId)
        slot = wheelSlot(@, wheelId, registerObject.callback, registerObject.data)
        baroboBridge.setMotorEventThreshold(@_id, wheelId, registerObject.distance)
        baroboBridge.motorChanged.connect(slot)
        baroboBridge.enableMotorSignals(@_id)

  unregister: ->
    baroboBridge.motorChanged.disconnect()
    baroboBridge.disableMotorSignals(@_id)

    baroboBridge.buttonChanged.disconnect()
    baroboBridge.disableButtonSignals(@_id)

#
# "Private" library methods.
#
# These functions translate baroboBridge's interface to LinkbotJS'
# interface, returning a (Qt) slot that calls a user-supplied (js)
# callback.
#
buttonSlot = (robot, buttonId, callback, model = {}) ->
  (robID, btnID, press) ->
    if press == 1 and robot._id == robID and buttonId == btnID
      callback(robot, model, { button: btnID })

wheelSlot = (robot, wheelId, callback, model = {}) ->
  (robID, _wheelId, angle) ->
    if robot._id == robID and wheelId == _wheelId
      diff = angle - robot._wheelPositions[wheelId - 1]
      robot._wheelPositions[wheelId - 1] = angle
      callback(robot, model, {
        triggerWheel: wheelId
        position: angle
        difference: diff
      })

#
# The mock baroboBridge object.
#
baroboBridge =
  if @baroboBridge?
    @baroboBridge
  else
    methods = [
      'angularSpeed'
      'availableFirmwareVersions'
      'buttonChanged'
      'connectRobot'
      'disconnectRobot'
      'enableButtonSignals'
      'enableMotorSignals'
      'disableButtonSignals'
      'disableMotorSignals'
      'firmwareVersion'
      'getMotorAngles'
      'scan'
      'setMotorEventThreshold'
      'stop'
    ]
    signals = [
      'motorChanged'
      'buttonChanged'
    ]
    obj = { mock: true }
    for k in methods
      obj[k] = ->
    for k in signals
      obj[k] = { connect: (->), disconnect: (->) }
    obj
