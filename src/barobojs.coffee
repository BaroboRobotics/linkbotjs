## BaroboJS API

# ## Controlling Robots
#
# This API has four robot control methods. *connect* returns a Robot
# object, documented elsewhere [where?].

# ### The methods
reactimate = (connections, model) ->
deactimate = (connections) ->
scan = ->
connect = (id) ->

# ## Integrating with BaroboLab

# ## Including the API in your code
#
# This module can be used by requirejs/AMD. In its absence, the methods can
# be accessed from the global Barobo object.
if define?
    define(
        reactimate: reactimate
        deactimate: deactimate
        scan: scan
        connect: connect
    )
else
    @Barobo =
        reactimate: reactimate
        deactimate: deactimate
        scan: scan
        connect: connect
