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
  'availableFirmwareVersions'
  'firmwareVersion'
]

baroboBridge.firmwareVersion.and.returnValue("FW")
baroboBridge.availableFirmwareVersions.and.returnValue(["FW"])
baroboBridge.getMotorAngles.and.returnValue([0,0,0])

# Spy on baroboBridge's signals
for sig in [
  'buttonChanged'
  'motorChanged'
]
  baroboBridge[sig] = jasmine.createSpyObj sig, [
    'connect'
    'disconnect'
  ]
