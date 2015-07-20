#SB+ Version Change Log

###Unreleased/pending:
* Added tab indexes/focus to HTML elements

---
###2.6.0 (04-01-2015)
* Added HTML5 download attribute to downloadable files
* Table of content now auto scroll when item is out of view
* Added supplement/zip package file to the download bar
* Refactored the code on getting downloadable files
* Updated the screen space for lesson title and instructor name on the header bar
* Fixed an issue where the table of contents disappeared after exiting expanded mode
* Added table of contents label to the top of table of contents list
* Table of contents control and button controls are no longer selectable/highlightable
* Removed the duplicate "source" folder inside the "build" folder
* Updated jQuery UI to version 1.11.3
* Updated jQuery to version 2.1.3
* Updated code to load Kaltura API once and only when it is need
* Updated VideoJs to version 4.11.4

###2.5.9 (01-16-2015)
* Removed progressing loader when all slides are video
* Improved fading out progressing loader
* Associated MSMGT to SMGT logo in the notes area when there are not notes
* Updated kWidget to version 2.25
* Google Chrome resolved the HTML5 video text aliasing issue on Windows, so HTML5 video player is back.

###2.5.8 (12-23-2014)
* Updated VideoJS to version 4.11.1
* Replace VideoJS Resolution switcher to [videojs-resolution-selector](https://github.com/dominic-p/videojs-resolution-selector)
* Updated to work with new media server
* Added a global variable to hold the server root directory
* Removed "open in a new tab" on mobile device
* Fixed the notes background color, so it is not gray when there are notes
* Improved MP4 support detection rather than browser sniffing

###2.5.7 (11-05-2014)
* Fixed an issue where Flash player is conflicting with resolution switcher
* Improved Flash player fallback for MP4 in Firefox

###2.5.6 (11-04-2014)
* Updated Kaltura kWidget to version 2.20
* Fixed an issue where videos are not playing properly on Firefox
* Fixed an issue where videos are not playing properly on Windows Google Chrome
* Fixed an issue where Kaltura videos are not playing in the video player

###2.5.5 (11-03-2014)
* Updated [video.js](https://github.com/videojs/video.js) CSS to version 4.10.0
* Replaced resolution switch plugin with a better resolution switching plugin

###2.5.4 (10-31-2014)
* Updated [video.js](https://github.com/videojs/video.js) to version 4.10.2

###2.5.3 (10-14-2014)
* Kaltura kWidget updated to version 2.19.2

###2.5.2 (10-07-2014)
* VideoJS uses Flash technology for users who view SB+ on Windows version of Google Chrome. Google Chrome on Windows has an [issue with aliasing](https://code.google.com/p/chromium/issues/detail?id=351458) on HTML5 video. This is a temporary fix and will revert back to HTML5 once Google resolved this issue.

###2.5.1 (10-06-2014)
* Resolved a duplicate function name that cause an error for the downloadable file function.
* Improved how the audio player should fade in and out. Also, display the player after playback ended.

###2.5.0 (10-06-2014)
* Replaced the three dots with the program logo in notes area for SB+ lesson that contains quiz but no notes. Program logo to display is based on where the SB+ lesson is stored in the directory. Defaults to UW-EX CEOEL logo if not in any program.

###2.4.0
* Kaltura videos are no longer embedded via iFrame. VideoJS will now play video sources from Kaltura with the use of kWidget javascript.
* Added feature to switch resolutions for video from Kaltura on VideoJS Player.
* Restyled VideoJS Control bar for more intuitive user experiences.

###2.3.0
* Removed notes font size adjustment controls.
* Removed magnifying button on slide images.
* Added the new expand/contract button to the control bar.
* Improved the profile panel.
* Removed fancybox scripts

###2.2.0
* Improved the quiz engine to handle multiple answer choices, images, and over all look and feel.

###2.1.0
* Can't remember... took an arrow to the brain!

###2.0.0
* Released SB+ version 2 to the world! Forgot all of the technical details because of the excitements.
