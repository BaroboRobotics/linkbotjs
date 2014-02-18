# Developer Documentation for LinkbotJS

This document is for LinkbotJS maintainers. Documentation for users is found
elsewhere [where?].

## If your life depends on it

Compile src/linkbot.coffee to javascript with
[coffee](http://coffeescript.org/).

## Testing

Unit tests are runnable with
[Karma](http://karma-runner.github.io/0.10/index.html) and
[Jasmine](http://jasmine.github.io/). You'll also need the [RequireJS
adapter](https://npmjs.org/package/karma-requirejs).

These things can be installed with npm, which is available on
Debian/Ubuntu. Use `sudo npm install -g $tool`.

I have a [cheatsheet for
Jasmine](https://workflowy.com/shared/d23cf9f1-acb7-4596-6b17-e022b8c0f393/),
since the docs read like a short story.

## Development automation

Building, unit testing, and API doc generation are automated with the auto
script. It has some tool dependencies, however:

* bash
* [inotify-tools](http://inotify-tools.sourceforge.net/) (available on Debian and Ubuntu)
* [CoffeeScript](http://coffeescript.org/)
* [Docco](http://jashkenas.github.io/docco/) documentation generator

## TODO: Mention license
