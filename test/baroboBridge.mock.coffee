# Spy on baroboBridge methods
baroboBridge = jasmine.createSpyObj "baroboBridge", [
  'getMotorAngles'
  'connectRobot'
  'setMotorEventThreshold'
  'angularSpeed'
  'disconnectRobot'
  'enableButtonSignals'
  'enableMotorSignals'
  'scan'
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
