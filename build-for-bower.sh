#!/bin/bash

set -e

coffee -c --no-header -o dist src/linkbot.coffee
cp -t dist src/linkbot.css
