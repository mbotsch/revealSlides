# revealSlides

This repository contains a framework for producing interactive HTML slides 
using [markdown](https://daringfireball.net/projects/markdown/syntax), 
[pandoc](https://pandoc.org/), and [reveal.js](https://pandoc.org/). It also uses a couple
of other cool Javascript packages for reveal plugins.

The framework for slide-building is tested on Linux and MacOS, although the resulting HTML slides
will work with any operating system and browser.

See <https://pmp-library.github.io/pmp-slides/slides.html> for a demo of the interactive capabilities.


## Getting started

1. Install a recent version (at least 2.6) of [pandoc](https://pandoc.org/)
2. **Recursively** clone this repository:\
   `$ git clone --recursive https://github.com/mbotsch/revealSlides.git`
3. Put (or soft-link) the directory `revealSlides` into the directory containing your markdown slides:\
   `$ cd <your-slide-directory> && ln -s <path-to-revealSlides> .`
4. Copy the `Makefile` from `revealSlides/slide-build/` into the directory containing your markdown slides:\
   `$ cd <your-slide-directory> && cp ./revealSlides/slide-build/Makefile .`
5. Call `make` to compile your slides to HTML.


## Viewing HTML slides

For viewing/presenting the HTML slides we recommend Chromium or Chrome, in particular for using the
virtual chalkboard. There are two options to view the slides in a webbrowser:
- Open the HTML-file in your browswer. This, however, requires a command-line option to allow
  the browser to load resources from your local file system:\
  `chromium-browser --allow-file-access-from-files  my-slides.html`
- Start a local webserver that serves your slide directory and open it in a webserver. For instance:\
  `python -m SimpleHTTPServer & chromium-browser http://localhost:8000`


## Recommended procedure

The most comfortable way to edit, compile, and view your slides is to start a
process that watches your markdown files, re-compiles them whenever they
change, and then triggers a re-load on the webserver/webbrowser. This process
can be started by `$ make server`. It automatically opens
`http://localhost:8000` on your default webbrowser, but you can also view it in
any other browser (in case Chromium is not your default browser).

This process is implemented through `nodejs` and `grunt`, which you have to install before:\
`sudo apt-get install nodejs && sudo npm install -g grunt`.

To clean-up your slide directory, call `make clean` to remove the compiled HTML
files. To clean-up the install nodejs and grunt files, call `make clean` in the
`revealSlides` folder.

