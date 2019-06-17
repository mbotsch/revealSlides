# Chalkboard Plugin

This plugin adds an interactive board to reveal.js. It is based on version 0.6 of 
[Asvin Goel's chalkboard plugin](https://github.com/rajgoel/reveal.js-plugins/).

Using this plugin, you can annotate your slides and use a clean board behind each slide for longer derivations or more complex drawings. These two modes are called *slide annotations* and *board drawings* in the following.

The chalkboard is tested using a Lenovo X1 Yoga running Linux and a MacBook with Astropad.


## Usage

- 't' and board icon on bottom left show/hide the board behind each slide.
  When there are drawings on the board, this icon will be marked red to inform users about it.
- 'c' and pen icon on bottom left enable/disable drawing on the slide or the board.
- 'e' and eraser icon on bottom left toggle eraser mode.
- hold pen icon for 1s to show color dialog.
- use left mouse or pen for drawing.
- use right mouse or pen-with-button-pressed for erasing.
- use touch events for controlling the virtual laser pointer.
- 'z' un-does last stroke.
- 'd' downloads the annotations and drawing to a JSON file. 
  Copy this file into the folder of your HTML presentation 
  to have the scribbles auto-loaded when starting the presentation.
- 'Enter' extends the board by one page height.


## Changes to Asvin Goel's original version

- Removed recording drawings and automatic playback.
- Removed network-transmitting drawings to another client.
- Removed original chalkboard effect to get cleaner drawing.
- Support for mouse events, touch events, pointer events (most efficient), and (somewhat) iPad stylus.
- More responsive drawing by exploiting Chrome's coalesced pointer events 
  (thanks to Martin Heistermann, Bern University!).
- Support for highDPI displays (thanks to Martin Heistermann). 
- Curves are rendered as Bezier curves to achieve a smoother appearance.
- Drawing supports multiple colors.
- Chalkboard drawings are more consistent under window rescaling.
- Both slide annotations and board drawings are exported to PDF.
- Cursor auto-hide, cool eraser cursor, laser pointer cursor in current pen color.
- Board can be enlarged by pressing `Return` for even longer derivations (thanks to Markus Nebel for the idea!).
- Prevent leaving presentation without saving board drawings.
- Supports latest reveal API and plugin structure.



## License

MIT licensed

Copyright (C) 2016 Asvin Goel, 2017-2019 Mario Botsch
