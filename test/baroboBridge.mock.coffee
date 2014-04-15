# Spy on baroboBridge methods
baroboBridge = jasmine.createSpyObj "baroboBridge", [
  'getMotorAngles'
  'connectRobot'
  'setMotorEventThreshold'
  'angularSpeed'
  'disconnectRobot'
  'enableButtonSignals'
  'enableMotorSignals'
  'disableButtonSignals'
  'disableMotorSignals'
  'scan'
  'stop'
]

# Spy on baroboBridge's signals
for sig in [
  'buttonChanged'
  'motorChanged'
]
  baroboBridge[sig] = jasmine.createSpyObj sig, [
    'connect'
    'disconnect'
  ]
