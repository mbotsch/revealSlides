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


## Recommended compilation procedure

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


## Slide Authoring

The syntax follows [pandoc's markdown](https://pandoc.org/MANUAL.html#pandocs-markdown). 
I will add an example presentation soon, so you can copy-and-paste from these examples.

Here's a first (incomplete) example presentattion: 
<https://pmp-library.github.io/pmp-slides/slides.html> 



## General Usage

When viewing/presenting the slides in a web browser, press '?' to get an
overview of the key bindings.  Here are the most important ones:
- Navigate using the Left/Right cursor keys or Home/End keys.
- 'f' to enter fullscreen mode, 'ESC' to leave it
- 'o' to enter overview mode, 'ESC' to leave it
- 'm' to open menu (or click slide number). Through the menu you can jump to
  specific slides, trigger the search dialog, trigger print-to-PDF, and
  download the whiteboard drawings.
- 'ctrl-shift-f' to open search dialog
- 's' to open speaker notes view

The virtual whiteboard also has a few key-bindings (see below).

Double-clicking an elements zooms in onto it. Double-clicking a second time zooms out again.



## Virtual Whiteboard and Slide Annotations

Thanks to the whiteboard plugin, you can annotate your slides and use an empty
whiteboard behind each slide for longer derivations or more complex drawings.
These two modes are called *slide annotations* and *whiteboard drawings* in the
following. 

Here's how to use the plugin:
- 'w' and board icon on bottom left show/hide the whiteboard behind each slide.
  When there are drawings on the board, this icon will be marked red to inform users about it.
- 'd' and pen icon on bottom left enable/disable drawing on the slide or the board.
- 'e' and eraser icon on bottom left toggle eraser mode.
- Hold pen icon for one second to show color dialog.
- Use left mouse or pen input for drawing.
- Use right mouse or pen-with-button-pressed for erasing.
- Use touch events for controlling the virtual laser pointer.
- 'z' un-does last stroke.
- 'Enter' extends the board by one page height.
- 'DEL' deletes all drawings for the current slide.
- The notes icon in the bottom right menu downloads the annotations and drawings to a JSON file. 
  Copy this file into the folder of your HTML presentation 
  to have the scribbles auto-loaded when starting the presentation.

Chromium or Chrome turned out to be the best choice when using the virtual whiteboard,
since it supports low-latency coalesced pointer events and smooth drawing curves (at least on Linux).


## License

MIT licensed

Copyright (C) 2017-2019 Mario Botsch

