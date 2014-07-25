## Developer Documentation for LinkbotJS

This document is for LinkbotJS maintainers. Here's a link to [user
docs](http://baroborobotics.github.io/LinkbotJS/).

### If your life depends on it

Compile src/linkbot.coffee to javascript with
[coffee](http://coffeescript.org/).

### Building for distribution via Bower

1. Create a release branch, following the
   [gitflow](https://www.atlassian.com/git/workflows#!workflow-gitflow)
   methodology.
1. Update bower.json to specify the new version number.
2. Compile the deliverable linkbot.js with `coffee -c --no-header -o . src/linkbot.coffee`
3. Check in those files
4. Merge into master, again following gitflow methdology (remembering to use
   `git merge --no-ff`).
5. Create a release tag (e.g. v0.2.0)
6. Push master and the tag to Github

### Consuming via Bower

`bower install linkbotjs=BaroboRobotics/LinkbotJS`

### Testing

Unit tests are runnable with
[Karma](http://karma-runner.github.io/0.10/index.html) and use
[Jasmine](http://jasmine.github.io/).

Karma can be installed with npm, which is available on Debian/Ubuntu. Use
`sudo npm install -g $tool`. (Jasmine is included with Karma.)

I have a [cheatsheet for
Jasmine](https://workflowy.com/shared/d23cf9f1-acb7-4596-6b17-e022b8c0f393/),
since the docs read like a short story.

### Development automation

Building, unit testing, and API doc generation are automated with the auto
script. It has some tool dependencies, however:

* bash
* [inotify-tools](http://inotify-tools.sourceforge.net/) (available on Debian and Ubuntu)
* [CoffeeScript](http://coffeescript.org/)
* [Docco](http://jashkenas.github.io/docco/) documentation generator

### TODO: Mention license
