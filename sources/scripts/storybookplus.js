/*
 * Storybook Plus
 *
 * @author: Ethan Lin
 * @url: https://github.com/oel-mediateam/sbplus
 * @version: 2.8.0
 * Released MM/DD/2016
 *
 * @license: GNU GENERAL PUBLIC LICENSE v3
 *
    Storybook Plus is an web application that serves multimedia contents.
    Copyright (C) 2013-2016  Ethan S. Lin, UWEX CEOEL Media Services

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/* global videojs */
/* global kWidget */

// global variable declarations
var topicCount = 0,
    counter = 0,
    previousIndex = 0,
    tocIndex = 0,
    tocClick = false,
    noteArray,
    topicSrc,
    topicTitle,
    imgPath,
    slideImgFormat = "png",
    accent = "",
    media = "Slide",
    version,
    imgCaption;

var questions,
    quizDetected = false;

var PROFILE,
    lessonTitle,
    instructor,
    duration;

var mediaPlayer = null,
    isKaltura = false,
    flavors = {},
    kalturaLoaded = 0;

//var ROOT_PATH = "https://media.uwex.edu/app/storybook_plus_v2/";
var ROOT_PATH = "../sources/";

// var tech = navigator.userAgent;
// var IS_CHROME = (/Chrome/i).test( tech );
// var IS_WINDOWS = (/Windows/i).test( tech );
// var IS_CHROME_39 = (/chrome\/[3][9]/i).test( tech );

// when document finished loading and ready
$( document ).ready( function() {

    $.fn.getLessonContent( "assets/topic.xml" );

});

/* MAIN CORE FUNCTIONS
***************************************************************/

/**
 * Using AJAX to request the topic XML file
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @param string, the XML file
 * @return void
 *
 */
$.fn.getLessonContent = function( file ) {

    $.ajax( {
        url: file,
        type: 'GET',
        dataType: 'xml',
        accepts: 'xml',
        content: 'xml',
        contentType: 'xml; charset="utf-8"',
        cache: false,
        encoding: 'UTF-8',
        beforeSend: function ( xhr ) {

            xhr.overrideMimeType( "xml; charset=utf-8" );
            xhr.setRequestHeader( "Accept", "text/xml" );

        },
        success: function ( xml ) {

            $.fn.parseContent( xml );

        },
        error: function ( xhr, exception ) {

            $.fn.displayGetLessonError( xhr.status, exception );

        }

    } );

};

/**
 * Parse the topic XML file for contents
 * @since 2.0.0
 * @updated 2.7.0
 *
 * @author Ethan S. Lin
 * @param string, the XML file
 * @return void
 *
 */
$.fn.parseContent = function( xml ) {

    var XMLData = $( xml ),
        SETUP = XMLData.find( "setup" ),
        TOPIC = XMLData.find( "topic" ),
        LESSON = $.fn.stripScript( SETUP.find( "lesson" ).text() ),
        INSTRUCTOR = $.trim( SETUP.find( "instructor" ).text() ),
        LENGTH = $.fn.stripScript( SETUP.find( "length" ).text() ),
        SLIDEFORMAT = $.fn.stripScript( SETUP.find('slideImgFormat').text() ),
        ACCENT = $.fn.stripScript( SETUP.find('accent').text() );
    
    PROFILE = $.fn.stripScript( XMLData.find( "profile" ).text() );

    lessonTitle = "Lesson name is not specified.";
    instructor = "Instructor name is not specified.";
    duration = '';

    // lesson title
    if ( LESSON.length ) {
        lessonTitle = LESSON;
    }

    // instructor name
    if ( INSTRUCTOR.length ) {
        instructor = INSTRUCTOR;
    }

    // length
    if ( LENGTH.length ) {
        duration = LENGTH;
    }

    // check image file format
    if ( SLIDEFORMAT.length ) {

        slideImgFormat = SLIDEFORMAT.toLowerCase();

    }
    
    if ( ACCENT.length ) {
        
        accent = ACCENT;
        
    }

    // assign values to variables
    topicSrc = [];
    topicTitle = [];
    noteArray = [];
    questions = [];

    // loop through each topic node to get lesson topics
    // display each topic to web page as well
    TOPIC.each( function() {
        
        // look for section break point
        var sectionBreak = $.trim( $( this ).attr( 'break' ) );
        var breakPoint = "";
        
        // if found
        if ( sectionBreak && 
            ( sectionBreak === "1" || sectionBreak === "y" || sectionBreak === "yes" ) ) {
            
            // set break point indicator
            breakPoint = "|";
            
        }
        
        topicTitle[topicCount] = $.trim( $( this ).attr( 'title' ) + breakPoint );
        topicSrc[topicCount] = $.trim( $( this ).attr( 'src' ) );
        noteArray[topicCount] = $.fn.stripScript( $( this ).find( "note" ).text() );

        if ( topicSrc[topicCount] === "quiz" ) {
            
            var quizNode = XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" );
            
            var questionNode        = $.fn.stripScript( quizNode.find( "question" ).text() ),
                questionImg         = $.trim( quizNode.find( "question" ).attr( "img" ) ),
                questionAudio       = $.trim( quizNode.find( "question" ).attr( "audio" ) ),
                choiceNode          = $.fn.stripScript( quizNode.find( "choice" ).text() ),
                choiceImg           = $.trim( quizNode.find( "choice" ).attr( "useImg" ) ),
                wrongFeedbackNode   = $.fn.stripScript( quizNode.find( "wrongFeedback" ).text() ),
                correctFeedbackNode = $.fn.stripScript( quizNode.find( "correctFeedback" ).text() ),
                quizTypeAttr        = $.trim( quizNode.attr( "type" ) ),
                answerNode          = $.fn.stripScript( quizNode.find( "answer" ).text() );

            var quiz = {};
            quiz.id = topicCount;
            quiz.type = quizTypeAttr;
            quiz.question = questionNode;
            quiz.img = ( questionImg !== "" ) ? questionImg : "";
            quiz.audio = ( questionAudio !== "" ) ? questionAudio : "";
            quiz.choiceImg = ( choiceImg !== "" ) ? choiceImg : "";

            if ( choiceNode ) {

                quiz.choice = $.fn.splitSelections( choiceNode );
                quiz.wrongFeedback = $.fn.splitSelections( wrongFeedbackNode );

            } else {

                quiz.wrongFeedback = wrongFeedbackNode;

            }

            quiz.answer = $.fn.splitSelections( answerNode );
            quiz.stuAnswer = "";
            quiz.correct = false;
            quiz.correctFeedback = correctFeedbackNode;
            quiz.taken = false;

            // add current quiz to array
            questions.push( quiz );

        }

        ++topicCount;

    });
    
    if ( questions.length ) {
        
        quizDetected = true;
        
    }

    // call to setup the player
    $.fn.setupPlayer();

};

/**
 * Set up the player
 * @since 2.0.0
 * @updated 2.8.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.setupPlayer = function() {

    var selfAssessmentIcon;

    version = ( $( "#storybook_plus_wrapper" ).attr( "data-version" ) === undefined ) ? "" : $ ( "#storybook_plus_wrapper" ).attr( "data-version" ).replace(/\./g, "");

    $( document ).attr( "title", lessonTitle );

    // hide error message container
    $( "#errorMsg" ).hide();

    // loop to check whether all topics are video or mixed
    $.each( topicSrc, function( i ) {

		var tSrc = topicSrc[i].substring( 0, topicSrc[i].indexOf( ":" ) + 1 );

		if ( tSrc === "video:" || tSrc === "youtube:" || tSrc === "vimeo:" || tSrc === "kaltura:" ) {

			media = "Video";

		} else {

			media = "Slide";
			return false;

		}

	} );

    if ( quizDetected === true || version >= 230 ) {

        $( "#storybook_plus_wrapper" ).addClass( "withQuiz" );

    }

	// loop to populate the table of contents
	$( "#selectable" ).before( '<div id="toc_heading" class="toc_heading" aria-hidden="true" tabindex="-1">Table of Contents</div>' );

    $.each( topicTitle, function( i ) {
        
        var breakClass = "";
        var menuItem = "";
        
		if ( topicSrc[i] === "quiz" ) {

		    selfAssessmentIcon = "<span class=\"icon-assessement light\"><span class=\"sr-only\">Self Assessement.</span></span> ";

		} else {

    		selfAssessmentIcon = "";

		}
        
        if ( topicTitle[i].indexOf( "|" ) !== -1 ) {
            
            topicTitle[i] = topicTitle[i].replace( "|", "" );
            breakClass = " sectionBreak";
            
        }
        
        if ( selfAssessmentIcon ) {
            
            menuItem = "<li class=\"ui-widget-content" + breakClass + "\" title=\"" + $.fn.htmlEntities( topicTitle[i] ) + "\">" + "<div class=\"title\"><span class=\"sr-only\">" + media + " <span class=\"selectedNum\">" + $.fn.addLeadingZero( i + 1 ) + "</span> of " + topicCount + ".</span> " + selfAssessmentIcon + topicTitle[i] + "</div></li>";
            
        } else {
            
            menuItem = "<li class=\"ui-widget-content" + breakClass + "\" title=\"" + $.fn.htmlEntities( topicTitle[i] ) + "\">" + "<div class=\"title\"><span class=\"sr-only\">" + media + "</span> <span class=\"selectedNum\">" + $.fn.addLeadingZero( i + 1 ) + "</span><span class=\"sr-only\">of " + topicCount + "</span>. " + topicTitle[i] + "<span class=\"sr-only\">.</span></div></li>";
            
        }
        
		$( "#selectable" ).append( menuItem );

	} );

	// set up the splash screen
    $( "#splash_screen" ).css( "background-image", "url(assets/splash.jpg)" );
    $( "#splash_screen" ).append( "<p tabindex=\"1\">" + lessonTitle + "</p><p tabindex=\"1\">" + instructor + "</p>" + ( ( duration !== 0 ) ? "<p tabindex=\"1\"><small>" + duration + "</small></p>" : "" ) + "<a tabindex=\"1\" role=\"button\" class=\"playBtn\" aria-label=\"Start Presentation\" href=\"#\">START</a>" );
    
    // if accent tag from XML has value
    if ( accent.length ) {
        
        $( ".playBtn" ).css( "background-color", accent );
        
    }

    // bind click event to splash screen
    $( ".playBtn" ).on( "click", function() {

        $.fn.initializePlayer();
        return false;

    } );

    // download files
    $.fn.getDownloadableFiles();

};

/**
 * Initialize the player
 * @since 2.0.0
 * @updated 2.8.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.initializePlayer = function() {

    // hide the error msg and splash screen
    $( "#splash_screen" ).hide();

    // setup up player header
    $( "#lessonTitle" ).attr( "title", lessonTitle );
    $( "#lessonTitle" ).html( lessonTitle );

    $( "#instructorName" ).html( "<a class=\"instructorName\" href=\"#\" tabindex=\"-1\">" + instructor + "</a>" );

    // setup profile panel
    $( "#profile .photo" ).before( "<div class=\"profileCloseBtn\"><a role=\"button\" id=\"profileClose\" href=\"#\" aria-label=\"Close Profile\" aria-controls=\"profile\" aria-expanded=\"true\" tabindex=\"1\"><span aria-hidden=\"true\">&times;</span></a></div>" );
    $( "#profile .bio" ).html( "<h2>" + instructor + "</h2>" + PROFILE );

    if ( media !== 'Video' ) {

        $( "#player" ).append( "<div id=\"progressing\"></div>" );

    }

	// bind for profile panel open/close toggle
    $( "#info, a.instructorName, #profileClose" ).on( "click", function() {

        if ( $( "#profile" ).is(":visible") ) {
        
            $( "#profile" ).fadeOut( "fast", function(){
                
                $( "#content" ).fadeIn( "fast" );
                
            } ).attr( "aria-expanded", "false" );
            
            $( "#info, a.instructorName, #profileClose" ).attr( 'aria-expanded', 'false' );

        } else {

            $( "#profile" ).fadeIn( "fast" ).attr( "aria-expanded", "true" );
            $( "#content" ).hide();
            $( "#info, a.instructorName, #profileClose" ).attr( 'aria-expanded', 'true' );

        }

        return false;

    } );

	// setup toc selectable items
    $( "#selectable" ).selectable( {
        
        appendTo: "#toc",
        autoRefresh: false,
        selecting: function( event, ui ) {
            
            if( $( ".ui-selected, .ui-selecting" ).length > 1) {
                
                $( ui.selecting ).removeClass( "ui-selecting" );
              
            }
            
        },
        
        stop: function() {
            
            tocClick = true;
            tocIndex = Number( $( ".ui-selected .selectedNum" ).html() ) - 1;

            if ( tocIndex !== previousIndex ) {
                
                $.fn.loadSlide( topicSrc[tocIndex], tocIndex );
                previousIndex = tocIndex;
    
            }
            
        }
        
    } );
    
    // bind left click event
    $( "#leftBtn, .hidden-pre-btn" ).on( "click", function() {

        $.fn.previousSlide();
        return false;

    } );

    // bind right click event
    $( "#rightBtn, .hidden-next-btn" ).on( "click", function() {

        $.fn.nextSlide();
        return false;

    });

    // add the zoom boutton to the control after the slide status
    if ( quizDetected === true || version >= 230 ) {

        $( "#control" ).append( "<span tabindex=\"-1\" id=\"magnifyBtn\" aria-hidden=\"true\"><span class=\"icon-expand\" title=\"Expand\"></span></span>" );
        $( "#magnifyBtn" ).before( "<span tabindex=\"-1\" id=\"tocBtn\" aria-hidden=\"true\"><span class=\"toc\" title=\"Toggle Table of Contents\"></span></span>" );
        $( "#magnifyBtn" ).before( "<span tabindex=\"-1\" id=\"notesBtn\" aria-hidden=\"true\"><span class=\"notes\" title=\"Toggle Notes\"></span></span>" );

        $.fn.bindImgMagnify();
        $.fn.bindNoteSlideToggle();
        $.fn.bindTocSlideToggle();

    }

    // call to load the first slide
    $.fn.loadSlide( topicSrc[0], counter );

    // load and set the instructor picture
    $.fn.loadProfilePhoto();

    // display the player
    $( "#player" ).fadeIn( 'fast' );
    
    // listen to global keyboard event
    $.fn.keyboardEvents();

};

/**
 * back to previous slide
 * @since 2.7.0
 * @author Ethan S. Lin
 *
 * @param none
 * @return void
 *
 */
$.fn.previousSlide = function() {
    
    counter--;

    if ( counter < 0 ) {
        counter = topicCount - 1;
    }

    $.fn.loadSlide( topicSrc[counter], counter );
    previousIndex = counter;
    
};

/**
 * advance to next slide
 * @since 2.7.0
 * @author Ethan S. Lin
 *
 * @param none
 * @return void
 *
 */
$.fn.nextSlide = function() {
    
    counter++;

    if ( counter > topicCount - 1 ) {
        counter = 0;
    }

    $.fn.loadSlide( topicSrc[counter], counter );
    previousIndex = counter;
    
};

/**
 * Load current slide
 * @since 2.0.0
 * @updated 2.8.0
 *
 * @author Ethan S. Lin
 *
 * @param string and int, slide type and slide number
 * @return void
 *
 */
$.fn.loadSlide = function( slideSource, sNum ) {
    
    var img;
    var srcName = slideSource.substring( slideSource.indexOf( ":" ) + 1 );
    var loader;
    
    if ( slideSource !== "quiz" ) {

        slideSource = slideSource.substring( 0, slideSource.indexOf( ":" ) + 1 );

    }

    if ( slideSource !== 'video:' && slideSource !== 'kaltura:' && slideSource !== 'youtube:' && slideSource !== 'vimeo:' ) {
        
        loader = setTimeout( function() {
            
            $( "#progressing" ).fadeIn("fast");
            
        }, 3000 );
        
        srcName = srcName.toLowerCase();

    }

    if ( $( "#slideNote" ).hasClass( "quizSlide" ) ) {

        $( "#slideNote" ).removeClass( "quizSlide" );

    }
    
    // dispose existing VideoJS instance
    if ( mediaPlayer !== null ) {

        mediaPlayer.dispose();
        mediaPlayer = null;
        $( '#vp' ).empty().hide();
        $( '#ap' ).empty().hide();

    }
    
    // reset areas
    $( "#slide" ).removeAttr("role").attr("tabindex",-1).empty();
    
    isKaltura = false;
    
    switch ( slideSource ) {
        
        case "image:":
            
            img = new Image();

            imgPath = "assets/slides/" + srcName + "." + slideImgFormat;
            imgCaption = $( "#selectable li .title" ).get( sNum ).innerHTML;
            imgCaption = imgCaption.replace( imgCaption.slice( imgCaption.indexOf( '<' ), imgCaption.lastIndexOf( '>' ) + 1 ), '' );

            $( img ).load( function() {

                $( this ).hide();
                $( "#slide" ).attr( { "role": "main", "tabindex": 1} ).html( "<div id=\"img\"></div>" );
                $( "#slide #img" ).html( img );
                $( this ).fadeIn();

            } ).error( function() {

                $.fn.displayErrorMsg( "image not found!", "Expected image: " + imgPath );

            } ).attr( {
                'src': imgPath,
                'alt': "Slide " + ( sNum + 1 ) + imgCaption,
                'border': 0
            } );

        break;

        case "image-audio:":

            $.fn.setupMediaPlayer( "audio", srcName );

        break;

        case "video:":

            $.fn.setupMediaPlayer( 'video', srcName );

        break;

        case "youtube:":
            
            $.fn.setupMediaPlayer( 'youtube', srcName );

        break;

        case "vimeo:":

            $.fn.setupMediaPlayer( 'vimeo', srcName );

        break;

        case "kaltura:":

            $.fn.setupMediaPlayer( 'kaltura', srcName );
            isKaltura = true;

        break;

        case "swf:":

            $( "#slide" ).html( "<object width=\"640\" height=\"360\" type=\"application/x-shockwave-flash\" data=\"assets/swf/" + srcName + ".swf\"><param name=\"movie\" value=\"assets/swf/" + srcName + ".swf\" /><div id=\"errorMsg\"><p>Error: Adobe Flash Player is not enabled or installed!</p><p>Adobe Flash Player is required to view this slide. Please enable or <a href=\"http://get.adobe.com/flashplayer/\" target=\"_blank\">install Adobe Flash Player</a>.</p></div></object>" ).promise().done( function() {

            } );

        break;

        case "quiz":

            $( "#slideNote" ).addClass( "quizSlide" );
            $.fn.setupQuiz( sNum );

        break;

        default:

            $.fn.displayErrorMsg( "Unknow slide type!", "Please double check the XML file." );

        break;

    }
    
    // update slide number status
    $( this ).updateSlideNum( sNum );
    
    // load notes
    $( this ).loadNote( sNum );
    
    // hide the progressing spinning
    clearTimeout( loader );

};

/**
 * Setup videojs player
 * @since 2.4.0
 * @updated 2.8.0
 *
 * @author Ethan S. Lin
 *
 * @param strings, slide type and source
 * @return void
 *
 */
 $.fn.setupMediaPlayer = function ( type, src ) {

    var playerID = "";
    var subtitle = "";

    switch( type ) {
        
        case "audio":
        
            playerID = "apc";
            
            $.get( 'assets/slides/' + src + '.' + slideImgFormat, function() {
                
                $.get( 'assets/audio/' + src + '.vtt', function() {

                    subtitle = "<track kind=\"subtitles\" src=\"assets/audio/" + src + ".vtt\" srclang=\"en\" label=\"English\">";
    
                } ).always( function() {
    
                    var audioSrc = "<source src=\"assets/audio/" + src + ".mp3\" type=\"audio/mp3\">";
                    
                    $( "#ap" ).html( "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\" poster=\"assets/slides/"+src+"."+slideImgFormat+"\">" + audioSrc + subtitle + "</video>" ).promise().done( function() {

                        $.fn.loadVideoJsPlayer( playerID, src );

                    } );
    
                } );
                
            } ).fail( function() {
                
                $.fn.displayErrorMsg( "Image not found!", "Expected image: assets/slides/" + src + "." + slideImgFormat );
                
            } );
            
        break;

        case "video":
            
            playerID = "vpc";

            $.get( 'assets/video/' + src + '.vtt', function() {

                subtitle = "<track kind=\"subtitles\" src=\"assets/video/" + src + ".vtt\" srclang=\"en\" label=\"English\">";

            } ).always( function() {

                var mp4Src = "<source src=\"assets/video/" + src + ".mp4\" type=\"video/mp4\">";

                $( "#vp" ).html( "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\">" + mp4Src + subtitle + "</video>" ).promise().done( function() {

                    $.fn.loadVideoJsPlayer( playerID, src );

                } );

            } );

        break;

        case "kaltura":
            
            playerID = "vpc";
            
            if ( kalturaLoaded === 0 ) {

                $.getScript( ROOT_PATH + '/scripts/mwembedloader.js', function() {

                    $.getScript( ROOT_PATH +  '/scripts/kwidgetgetsources.js', function() {

                        $.fn.requestKalturaAPI( playerID, src );
                        kalturaLoaded = 1;

                    } ); // end kwidget.getsources.js

                } ); // end mwembedloader.js

            } else {

                $.fn.requestKalturaAPI( playerID, src );

            }

        break;
        
        case "youtube":
        
            playerID = "ytb";
            $( "#vp" ).html( "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\"></video>" ).promise().done( function() {

                    $.fn.loadVideoJsPlayer( playerID, src );

            } );
        
        break;
        
        case "vimeo":
        
            playerID = "vm";
            $( "#vp" ).html( "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\"></video>" ).promise().done( function() {

                    $.fn.loadVideoJsPlayer( playerID, src );

            } );
        
        break;

        default:
            $.fn.displayErrorMsg( "Video error!", "Please double check your XML file." );
        break;

    }

 };

/**
 * Requesting data from Kaltura API, construct src,
 * and call loadVideoJSPlayer
 * @since 2.6.0
 * @updated 2.8.0
 *
 * @author Ethan S. Lin
 *
 * @param strings, playerID and source
 * @return void
 *
 */
 $.fn.requestKalturaAPI = function( playerID, src ) {

    var entryId, captionId, captionExt, captionLang, video, duration;
    
    kWidget.getSources( {

        'partnerId': 1660872,
        'entryId': src,
        'callback': function( data ) {

            entryId = data.entryId;
            captionId = data.captionId;
            captionExt = data.captionExt;
            captionLang = data.captionLang;
            duration = data.duration;

            for( var i in data.sources ) {

                var source = data.sources[i];

                if ( source.flavorParamsId === 487061 ) {

                    flavors.low = source.src;

                }

                if ( source.flavorParamsId === 487071 ) {

                    flavors.normal = source.src;

                }

                if ( source.flavorParamsId === 487081 ) {

                    flavors.high = source.src;

                }

                if ( source.flavorParamsId === 487111 ) {

                    flavors.webm = source.src;

                }

            } // end for loop

            // video element opening tag
            video = "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\" crossorigin=\"anonymous\">";

            if ( flavors.webm !== undefined && $.fn.supportWebm() ) {
                video += "<source src=\"" + flavors.webm + "\" type=\"video/webm\" />";
            }

            // set caption track if available
            if ( captionId !== null ) {
                video += "<track kind=\"subtitles\" src=\"https://www.kaltura.com/api_v3/?service=caption_captionasset&action=servewebvtt&captionAssetId="+captionId+"&segmentDuration="+duration+"&segmentIndex=1\" srclang=\"en\" label=\"English\">";
            }

            // closing video tag
            video += "</video>";

            // insert video tag to #vp element
            $( "#vp" ).html( video );

            $.fn.loadVideoJsPlayer(playerID);

        } // end callback

    } ); // end kWidget

 };

/**
 * load videojs player
 * @since 2.4.1
 * @updated 2.8.0
 * @author Ethan S. Lin
 *
 * @param strings, video element id
 * @return void
 *
 */
$.fn.loadVideoJsPlayer = function( playerID, src ) {

    var options = {

        techOrder: ["html5", "flash"],
        "width": 640,
        "height": 360,
        "controls": true,
        "autoplay": true,
        "preload": "auto",
        "playbackRates": [0.5, 1, 1.5, 2],
        "plugins": {}

    };
    
    switch ( playerID ) {
        
        case 'vpc':
            
            if ( $.fn.supportMp4() === false && $.fn.supportWebm() === false ) {

                options.techOrder = ["flash", "html5"];
                options.plugins = null;
        
            }
            
            if ( isKaltura ) {
                
                options.plugins = { videoJsResolutionSwitcher: { 'default': 720 } };
                
            }
            
            $( "#vp" ).fadeIn();
            
        break;
        
        case 'apc':
            
            options.poster = 'assets/slides/' + src + "." + slideImgFormat;
            options.plugins = null;
            $( "#ap" ).fadeIn();
            
        break;
        
        case 'ytb':
        
            options.techOrder = ["youtube"];
            options.sources = [{ "type": "video/youtube", "src": "https://www.youtube.com/watch?v=" + src }];
            options.plugins = { videoJsResolutionSwitcher: { 'default': 720 } };
            $( "#vp" ).fadeIn();
            
        break;
        
        case 'vm':
            
            options.techOrder = ["vimeo"];
            options.sources = [{ "type": "video/vimeo", "src": "https://vimeo.com/" + src }];
            options.plugins = null;
            $( "#vp" ).fadeIn();
            
        break;
        
        
    }
    
    mediaPlayer = videojs( playerID, options, function() {

        if ( options.techOrder[0] === "vimeo" ) {

            this.play();
            
        }
        
        if ( isKaltura ) {
        			
			this.updateSrc( [
    			
    			{
        			
        			src: flavors.low,
        			type: "video/mp4",
        			label: "low",
        			res: '360'
        			
    			},
    			{
        			
        			src: flavors.normal,
        			type: "video/mp4",
        			label: "normal",
        			res: '720'
        			
    			},
    			{
        			
        			src: flavors.high,
        			type: "video/mp4",
        			label: "high",
        			res: '1080'
        			
    			}
    			
			] );
		}

    } );

    videojs.options.flash.swf = ROOT_PATH + "videoplayer/video-js.swf";

};

/**
 * Setup self-assessment question
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 *
 * @param int, topic slide index
 * @return void
 *
 */
$.fn.setupQuiz = function( num ) {

    var index = 0, found = false;

    // loop to find the question
    while ( !found || index >= questions.length ) {

        if ( questions[index].id === num ) {

            found = true;

        } else {

            index++;

        }

    }

    // build the question
    $( "#slide" ).attr( { "role": "main", "tabindex": 1} )
                 .html( "<div id=\"quiz\"><div class=\"header\" aria-label=\"Self Assessment\"><span class=\"icon-assessement\"></span> Self Assessment</div>" );

    if ( !questions[index].taken ) {

        if ( questions[index].img !== "") {

            var img = new Image();

            imgPath = "assets/img/" + questions[index].img;

            $( img ).load( function() {

                $( "#quiz" ).append( "<div id=\"quiz_quest\" class=\"question\">" + questions[index].question + "</div>" );
                $( ".question" ).append( img );

                var audio = "";

                if ( questions[index].audio !== "") {

                    audio = "<audio controls><source src=\"assets/audio/" + questions[index].audio + ".mp3\" type=\"audio/mpeg\" /></audio>";
                    $( "#quiz" ).append( audio );

                }

               $.fn.displayAnswerChoices( index );

            } ).error( function() {

                $.fn.displayErrorMsg( "image not found!", "Expected image: " + imgPath );

            } ).attr( {
                'src': imgPath,
                'alt': questions[index].question,
                'border': 0
            } );

        } else {

            var audio = "";

            if ( questions[index].audio !== "") {
                audio = "<audio controls><source src=\"assets/audio/" + questions[index].audio + ".mp3\" type=\"audio/mpeg\" /></audio>";
            }

            $( "#quiz" ).append( "<div id=\"quiz_quest\" class=\"question\">" + questions[index].question + audio + "</div>" );
            $.fn.displayAnswerChoices( index );

        }

    } else {

        $.fn.showFeedback( index );

    }

};

/**
 * Display current self assessment answer choice or types
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 *
 * @param int, current question index
 * @return void
 *
 */
$.fn.displayAnswerChoices = function( index ) {

    var answerLength,
        quizError = false;

    switch( questions[index].type ) {

        case "t/f":
        
            $( '#quiz .header' ).append( ': True or False' );
            $( "#quiz" ).append( "<div class=\"answerArea\"><label for=\"t\"><input role=\"radio\" id=\"t\" type=\"radio\" name=\"tf\" value=\"true\" /> True</label><label for=\"f\"><input role=\"radio\" type=\"radio\" id=\"f\" name=\"tf\" value=\"false\" /> False</label></div>" );

        break;

        case "fib":
            
            $( '#quiz .header' ).append( ': Fill In The Blank' );
            $( "#quiz" ).append( "<div class=\"answerArea\"><input role=\"input\" aria-required=\"true\" type=\"text\" aria-describedby=\"quiz_quest\" id=\"saAns\" /></div>" );

        break;

        case "mc":
            
            var type = "radio";
            var name = "mc";
            
            answerLength = questions[index].answer.length;

            if ( answerLength > 1 ) {

                type = "checkbox";
                name = "ma";
                $( '#quiz .header' ).append( ': Multiple Answers' );

            } else {
                
                $( '#quiz .header' ).append( ': Multiple Choices' );
                
            }
            
            $( "#quiz" ).append( "<div class=\"answerArea\">" );

            if ( questions[index].choiceImg === "true" ) {

                for ( var i = 0; i < questions[index].choice.length; i++ ) {

                    $( ".answerArea" ).append( "<label class=\"img_choice\" for=\"" + i + "\"><input role=\""+type+"\" id=\"" + i + "\" type=\"" + type  + "\" name=\"" + name + "" + "\" value=\"" + $.fn.htmlEntities( questions[index].choice[i] ) + "\" /> <img src=\"assets/img/" + questions[index].choice[i] + "\" /></label>" );

                }

            } else {

                for ( var j = 0; j < questions[index].choice.length; j++ ) {

                    $( ".answerArea" ).append( "<label for=\"" + j + "\"><input role=\""+type+"\" id=\"" + j + "\" type=\"" + type  + "\" name=\"" + name + "" + "\" value=\"" + $.fn.htmlEntities( questions[index].choice[j] ) + "\" /> " + questions[index].choice[j] + "</label>" );

                }

            }

            $( "#quiz" ).append( "</div>" );

        break;

        case "sa":
            
            $( '#quiz .header' ).append( ': Short Answer' );
            $( "#quiz" ).append( "<div class=\"answerArea\"><textarea role=\"textbox\" aria-describedby=\"quiz_quest\" aria-multiline=\"true\" aria-required=\"true\" id=\"saAns\"></textArea></div>" );

        break;

        default:

            quizError = true;
            $.fn.displayErrorMsg( "unknow question type!", "Please double check the topic XML file." );

        break;

    }

    if ( !quizError ) {

        $( "#quiz" ).append( "<div class=\"submitArea\"><a role=\"button\" id=\"check\" rel=\"" + index + "\" href=\"#\">SUBMIT</a></div>" );
        $( "#slide" ).append( "</div>" );

        // give the quiz a second to build up
        $( "#quiz" ).hide().fadeIn();

        // click event to check answer
        $( "#check" ).on( "click", function() {

            var index = Number( $( this ).attr( "rel" ) ),
                stuAnswer;

            switch( questions[index].type ) {

                case "t/f":

                    stuAnswer = $( "input:radio[name=tf]:checked" ).val();

                    if ( stuAnswer === undefined ) {

                        stuAnswer = "";

                    }

                break;

                case "fib":

                    stuAnswer = $.trim( $( "#saAns" ).val() );

                break;

                case "mc":

                    if ( answerLength > 1 ) {

                        stuAnswer = [];
                        $( "input:checkbox[name=ma]:checked" ).each( function() {
                            stuAnswer.push( $( this ).val() );
                        } );

                        questions[index].incorrectIndex = 0;

                    } else {

                        stuAnswer = $( "input:radio[name=mc]:checked" ).val();
                        questions[index].incorrectIndex = $( "input:radio[name=mc]" ).index( $( "input:radio[name=mc]" ).filter( ":checked" ) );

                    }

                    if ( stuAnswer === undefined || stuAnswer.length <= 0 ) {

                        stuAnswer = "";

                    }

                break;

                case "sa":

                    stuAnswer = $.trim( $( "#saAns" ).val() );

                break;

                default:

                    stuAnswer = "";

                break;

            }

            if (stuAnswer !== "") {

                switch( questions[index].type ) {

                    case "fib":

                        for ( var i = 0; i < questions[index].answer.length; i++ ) {

        					if ( stuAnswer.toLowerCase() === questions[index].answer[i].toLowerCase() ) {

        						questions[index].correct = true;
        						break;

        					}

        				}

                    break;

                    case "t/f":

                        if ( stuAnswer === String ( questions[index].answer ) ) {

                            questions[index].correct = true;

                        } else {

                            questions[index].correct = false;

                        }

                    break;

                    case "mc":

                        var answerCount = 0;

                        if ( answerLength > 1 ) {

                            for ( answerCount = 0; answerCount < stuAnswer.length; answerCount++ ) {

                                if ( $.inArray( stuAnswer[answerCount], questions[index].answer ) >= 0 ) {

                                    questions[index].correct = true;

                                } else {

                                    questions[index].correct = false;
                                    break;

                                }

                            }

                            if ( answerCount < questions[index].answer.length ) {

                                questions[index].correct = false;

                            }

                        } else {

                            var sa = $.fn.htmlEntities( stuAnswer );
                            var qa = $.fn.htmlEntities( questions[index].answer[0] );
                                
                            if ( sa === qa ) {

                                questions[index].correct = true;

                            } else {

                                questions[index].correct = false;

                            }

                        }

                    break;

                    default:

                        questions[index].correct = false;

                    break;

                }

                questions[index].stuAnswer = stuAnswer;
                questions[index].taken = true;

                $.fn.showFeedback( index );

            } else {

                $( ".question" ).before( "<p class=\"quizIncorrect\"><span class=\"icon-notification\"></span> Please answer the question before submitting!</p>" );
                $( ".quizIncorrect" ).delay( 6000 ).slideUp( "slow", function() {

                    $( ".question" ).prev().remove();

                } );

            }

            return false;

        } ); // end click event

    }

};

/**
 * Display current self assessment feedback
 * @since 2.0.0
 * @updated 2.7.0
 *
 * @author Ethan S. Lin
 *
 * @param int, current question index
 * @return void
 *
 */
$.fn.showFeedback = function( index ) {

    var questionImg = "";
    var audio = "";

    $( "#slide" ).html( "<div id=\"quiz\"><div aria-label=\"Self Assessment Feedback\" class=\"header\"><span class=\"icon-assessement\"></span> Self Assessment Feedback</div>" );

    if ( questions[index].type !== "sa" ) {

        if ( questions[index].correct ) {

            $( "#quiz" ).append( "<p class=\"quizCorrect\"><span class=\"icon-checkmark\"></span> CORRECT</p>" );

        } else {

            $( "#quiz" ).append( "<p class=\"quizIncorrect\"><span class=\"icon-notification\"></span> INCORRECT</p>" );

        }

    }

    if ( questions[index].img !== "" ) {

        questionImg = "<img aria-hidden=\"true\" src=\"assets/img/" + questions[index].img + "\" alt=\"" + questions[index].question + "\" border=\"0\" />";

    }

    if ( questions[index].audio !== "") {
        audio = "<audio controls aria-hidden=\"true\"><source src=\"assets/audio/" + questions[index].audio + ".mp3\" type=\"audio/mpeg\" /></audio>";
    }

    $( "#quiz" ).append( "<div class=\"question\" aria-hidden=\"true\">" + questions[index].question + questionImg + audio + "</div>" );

    if ( questions[index].choiceImg === "true" ) {

        $( "#quiz" ).append( "<div class=\"result\"><p><strong>Your answer</strong>:<br />" + $.fn.parseArrayImg( questions[index].stuAnswer ) + "</p></div>" );
        $('.result').append('<p><strong>Correct answer</strong>:<br />' + $.fn.parseArrayImg( questions[index].answer ) + '</p>');

    } else {

        $( "#quiz" ).append( "<div class=\"result\"><p><strong>Your answer</strong>:<br />" + $.fn.parseArray( questions[index].stuAnswer ) + "</p></div>" );
        $('.result').append('<p><strong>Correct answer</strong>:<br />' + $.fn.parseArray( questions[index].answer ) + '</p>');

    }

    if ( questions[index].type !== "sa" ) {

        if ( questions[index].correct ) {

            if ( String( questions[index].correctFeedback ) !== "" ) {

                $('.result').append('<p><strong>Feedback:</strong><br />' + questions[index].correctFeedback + '</p>');

            }

        } else {

            if (questions[index].type === "mc") {

                var feedback = questions[index].wrongFeedback[questions[index].incorrectIndex];

                if ( feedback === undefined ) {
                    feedback = questions[index].wrongFeedback;
                }

                if ( String( feedback ) !== "" ) {

                    $('.result').append('<p><strong>Feedback:</strong><br />' + feedback + '</p>');

                }

            } else {

                if ( String( questions[index].wrongFeedback ) !== "" ) {

                    $('.result').append('<p><strong>Feedback:</strong><br />' + questions[index].wrongFeedback + '</p>');

                }

            }

        }

    }

};

/**
 * Load notes for the current slide
 * @since 2.1.0
 * @update 2.8.0
 *
 * @author Ethan S. Lin
 * @param int, current topic number
 * @return void
 *
 */
$.fn.loadNote = function( num ) {

    var note = noteArray[num];
    
    if ( note.length ) {
        
        $( "#note" ).removeClass( "noNotes" )
                    .removeAttr( "aria-hidden" )
                    .attr( { "tabindex": 1, "role": "complementary", "aria-label": "Notes" } )
                    .html( note ).hide().fadeIn( "fast" );
                    
        $( "#currentSlide" ).append( "This " + media.toLowerCase() + " contains notes." );
        
        if ( $( "#note" ).find( "a" ).length ) {

    		$( "#note a" ).each( function() {
    			$( this ).attr( "target", "_blank" );
    
            });
    
        }
        
        setTimeout(function() {
            
            if ( mediaPlayer !== null ) {
            
                mediaPlayer.on( "ended", function() {
                    
                    $( "#hasNote" ).html("This " + media.toLowerCase() + " contains notes. Please navigate to the notes area with your keyboard." );
                    
                });
                
            } else {
                
                $( "#hasNote" ).html("This " + media.toLowerCase() + " contains notes. Please navigate to the notes area with your keyboard." );
                
            }
            
        }, 3000 );
        
    } else {
        
        $( "#note" ).addClass( "noNotes" )
                    .removeAttr( "role" )
                    .removeAttr( "aria-label" )
                    .attr( { "tabindex": -1, "aria-hidden": true } );
                    
        $( "#hasNote" ).empty();
                    
        $.fn.getProgramLogo();
        
    }
    
    $.fn.displayNotesBtn();

};

/**
 * Get the current program logo if no notes
 * @since 2.7.0
 *
 * @author Ethan S. Lin
 * @param none
 * @return void
 *
 */
 $.fn.displayNotesBtn = function() {
     
     // display or hide the note button in magnified view
    if ( $( "#storybook_plus_wrapper" ).hasClass( "magnified" ) ) {
        
        if ( $( "#note").hasClass( "noNotes" ) ) {
                
            $( "#currentStatus" ).addClass( "extendStatusWidth" );
            $( "#notesBtn" ).hide( function() {
                
                $( this ).attr( 'aria-label', '' ).attr( 'aria-hidden', true );
                
            } );
            
        } else {
            
            $( "#currentStatus" ).removeClass( "extendStatusWidth" );
            $( "#notesBtn" ).show();
            
        }
        
    }
     
 };

/**
 * Get the current program logo if no notes
 * @since 2.7.0
 *
 * @author Ethan S. Lin
 * @param none
 * @return void
 *
 */
 $.fn.getProgramLogo = function() {
     
     var dir = $.fn.getProgramDirectory();
     var logo = "uw_ex_ceoel_logo";
     var alt = "University of Wisconsin-Extension Division of Continuing Education, Outreach &amp; E-Learning";
     var img = "";

    switch( dir ) {

        case "smgt":
        case "msmgt":
            logo = "uw_smgt_logo";
            alt = "University of Wisconsin Sustainable Management";
        break;

        case "hwm":
            logo = "uw_hwm_logo";
            alt = "University of Wisconsin Health &amp; Wellness Management";
        break;

        case "himt":
            logo = "uw_himt_logo";
            alt = "University of Wisconsin Health Information Management &amp; Technology";
        break;

        case "il":
            logo = "uw_il_logo";
            alt = "University of Wisconsin Independent Learning";
        break;

        case "flx":
            logo = "uw_flx_logo";
            alt = "University of Wisconsin Flexible Option";
        break;

        case "bps":
            logo = "uw_bps_logo";
            alt = "University of Wisconsin Bachelor of Professional Studies in Organization Leadership and Communication";
        break;
        
        case "ds":
            logo = "ds_logo";
            alt = "University of Wisconsin Data Science";
        break;
        
        case "learning_store":
            logo = "uls_logo";
            alt = "University Learning Store";
        break;

    }
    
    img = "<img src=\"" + ROOT_PATH + "img/" + logo + ".svg\" width=\"150\" height=\"65\" alt=\"" + alt + "\" border=\"0\" />";
    
    $( "#note" ).html( "<div class=\"logo\" tabindex=\"-1\" aria-hidden=\"true\">" + img + "</div>" );
     
 };

/**
 * Update the current slide number indicator
 * @since 2.1.0
 * @updated 2.8.0
 *
 * @author Ethan S. Lin
 * @param int, current topic number
 * @return void
 *
 */
$.fn.updateSlideNum = function( num ) {

    var currentNum = num + 1;
    var status = media + " " + currentNum + " of " + topicCount;
    
    counter = num;
    
    $( "#selectable" ).selectable( "refresh" ).selectItem( "li:nth-child(" + currentNum + ")" );
    $( "#currentStatus" ).html( "<span>" + status + "</span>" );
    
    // add screen reader only hidden element
    $( "#currentSlide" ).html( "You are currently on " + media.toLowerCase() + " " + currentNum  + " of " + topicCount + ". " + $( ".ui-selected" ).attr( "title" ) + ". " );
    
    if ( currentNum === topicCount ) {
        
        setTimeout(function() {
            
            if ( mediaPlayer !== null ) {
            
                mediaPlayer.on( "ended", function() {
                    
                    if ( $( "#note" ).hasClass( "noNote" ) === false ) {
                        
                        $( "#hasNote" ).html( "This " + media + " contains notes." );
                        
                    }
                    
                    $( "#endPresentation" ).html("End of presentation. Next button will take you back to the first " + media + "." );
                    
                });
                
            } else {
                
                if ( $( "#note" ).hasClass( "noNote" ) === false ) {
                        
                    $( "#hasNote" ).html( "This " + media + " contains notes." );
                    
                }
                
                $( "#endPresentation" ).html("End of presentation. Next button will take you back to the first " + media + "." );
                
            }
            
            
        }, 3000 );
        
    } else {
        
        $( "#endPresentation" ).empty();
        
    }
    
    // listen to table of content auto scroll
    $( ".ui-selected" ).autoscroll();

};

/**
 * Magnify the current slide image and video
 * @since 2.0.0
 * @updated 2.7.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.bindImgMagnify = function() {

    $( "#magnifyBtn" ).on( "click", function() {

        if ( $( "#storybook_plus_wrapper" ).hasClass( "magnified" ) ) {

            $( "#storybook_plus_wrapper" ).removeClass( "magnified" );
            $( this ).html( "<span class=\"icon-expand\" title=\"Expand\"></span>" );
            
            $( "#notesBtn, #tocBtn" ).hide( function() {
                
                $( this ).attr( 'aria-label', '' ).attr( 'aria-hidden', true );
                
            } );
            
            $( "#toc" ).css( 'left', '' ).show();

            if ( $( "#tocBtn" ).hasClass( 'active' ) ) {

                $( "#tocBtn" ).removeClass( 'active' );

            }

        } else {

            $( "#storybook_plus_wrapper" ).addClass( "magnified" );
            $( this ).html( "<span class=\"icon-contract\" title=\"Contract\"></span>" );
            $( "#tocBtn" ).show();
            $( "#currentStatus" ).addClass( "extendStatusWidth" );
            $( "#toc" ).hide();

        }
        
        $.fn.displayNotesBtn();

    } );

};

/**
 * Animate notes area up and down in expanded mode
 * @since 2.2.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.bindNoteSlideToggle = function() {

    var note = $( "#note" );
    var openPos = 360, closedPos = 536;

    $( "#notesBtn" ).on( "click", function() {

        var currentPos = Math.ceil( note.offset().top );
        var pos = 0;

        if ( currentPos >= closedPos ) {

            pos = openPos;
            $(this).addClass( "active" );

        } else {

            pos = closedPos;
            $(this).removeClass( "active" );

        }

        if ( $( "#toc" ).offset().left <= 642 ) {

            $( "#toc" ).animate( {

                "left": 900

            } );

            $( "#tocBtn" ).removeClass( "active" );

        }

        note.animate( {

            "top": pos

        } );

    } );

};

/**
 * Slide table of contents left and right in expanded mode
 * @since 2.2.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.bindTocSlideToggle = function() {

    var toc = $( "#toc" );
    var openPos = 642, closedPos = 900;

    $( "#tocBtn" ).on( "click", function() {
        
        $( "#toc" ).show();
        
        var currentPos = Math.ceil( toc.offset().left );
        var pos = 0;
        
        if ( currentPos >= closedPos ) {

            pos = openPos;
            $(this).addClass( "active" );

        } else {

            pos = closedPos;
            $(this).removeClass( "active" );
        
        }

        if ( $( "#note" ).offset().top >= 360 ) {

            $( "#note" ).animate( {

                "top": 536

            } );

            $( "#notesBtn" ).removeClass( "active" );

        }

        toc.animate( {

            "left": pos

        }, function() {
            
            if ( pos >= closedPos ) {
                
                $( "#toc" ).hide();
                
            }
            
        } );

    } );

};

/**
 * Loading the instructor profile image
 * @since 2.0.0
 * @update 2.7.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.loadProfilePhoto = function() {

    var img = new Image(),
        imgPath = "assets/pic.jpg";

    $( img ).load( function() {

        $( "#profile .photo" ).html( "<img src=\"" + imgPath + "\" border=\"0\" alt=\"An photo of the instructor\" />" );

    } ).error( function() {

        $( "#profile .photo" ).html( "<img src=\"" + ROOT_PATH + "img/profile.png\" width=\"200\" height=\"300\" alt=\"No instructor photo\" border=\"0\" />" );

    } ).attr( {

        "src": imgPath,
        "border": 0

    } );

};

/**
 * Request downloadable files
 * @since 2.1.0
 * @updated 2.6.0
 *
 * @author Ethan S. Lin
 * @param strings, file name and extension
 * @return void
 *
 */
$.fn.getDownloadableFiles = function() {

    var directory = $.fn.getDirectory();
    var downloadBar = $( "#download_bar" );
    var url = window.location.href;
    var result = "";
    
	url = url.substr( 0, url.lastIndexOf( "/" ) + 1 ) + directory;
	downloadBar.html( "Loading downloadable items..." );

	// get transcript first
	$.get( url + '.pdf', function() {

    	result += "<div class=\"download_item\"><a role=\"button\" download href=\"" + url + ".pdf\" target=\"_blank\" tabindex=\"1\"><span class=\"icon-arrow-down\"><span><span class=\"sr-only\">Download</span> Transcript <span class=\"sr-only\">file</span></a></div>";

	} ).always( function() {
        
    	// get audio file
    	$.get( url + '.mp3', function() {

        	result += "<div class=\"download_item\"><a role=\"button\" download href=\"" + url + ".mp3\" target=\"_blank\" tabindex=\"1\"><span class=\"icon-arrow-down\"><span><span class=\"sr-only\">Download</span> Audio <span class=\"sr-only\">file</span></a></div>";

    	} ).always( function() {

        	// get package/zip file
        	$.get( url + '.zip', function() {

            	result += "<div class=\"download_item\"><a role=\"button\" download href=\"" + url + ".zip\" target=\"_blank\" tabindex=\"1\"><span class=\"icon-arrow-down\"><span><span class=\"sr-only\">Download</span> Supplement <span class=\"sr-only\">file</span></a></div>";

        	} ).always( function() {
            	
            	downloadBar.html( result ).hide().fadeIn( 1000 );
            	
        	});

    	} );

	} );

};

/**
 * Handling AJAX and XML parsing error
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @param strings, header and exception
 * @return void
 *
 */
$.fn.displayGetLessonError = function( status, exception ) {

    var statusMsg, exceptionMsg;

    switch ( status ) {

        case 0:
            statusMsg = "<strong>Error 0</strong> - Not connect. Please verify network.";
        break;
        case 200:
            statusMsg = "<strong>Error 200</strong> - Invalid characters in XML.";
        break;
        case 404:
            statusMsg = "<strong>Error 404</strong> - Requested page not found.";
        break;
        case 406:
            statusMsg = "<strong>Error 406</strong> - Not acceptable error.";
        break;
        case 500:
            statusMsg = "<strong>Error 500</strong> - Internal Server Error.";
        break;
        default:
            statusMsg = "Unknow error ... " + status;
        break;

    }

    switch ( exception ) {

        case "parsererror":
            exceptionMsg = "XML parse failed. Please double-check the <strong>topic.xml</strong> file in the <strong>assets</strong> directory. All node values must be wrapped inside <code>&lt;![CDATA[ ... ]]&gt;</code> or use HTML entity for special characters.";
        break;
        case "timeout":
            exceptionMsg = "XML parsing timed out. It is taking too long for the browser.";
        break;
        case "abort":
            exceptionMsg = "Ajax request aborted.";
        break;
        case "error":
            exceptionMsg = "Failed to get requested source. Most likely a 404 or 406.";
        break;
        default:
            exceptionMsg = 'Uncaught Error ... ' + status.responseText;
        break;

    }

    $('#splash_screen, #player').hide();
    $('#errorMsg').html('<p>' + statusMsg + '</p><p>' + exceptionMsg + '</p>');

};

/* MISC. HELPER FUNCTIONS
***************************************************************/

/**
 * Split a string with the | character as the delimiter
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param string, the string to split
 * @return array, array of selections
 *
 */
$.fn.splitSelections = function( arg ) {

    return arg.split("|");

};

/**
 * Get the course directory name
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @return string, the directory name
 *
 */
$.fn.displayErrorMsg = function( lineOne, lineTwo ) {

	$( "#slide" ).html( "<div id=\"errorMsg\"><p><strong>Error:</strong> " + lineOne + "</p><p>" + lineTwo + "</p></div>" );

};

/**
 * Get the course directory name
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @return string, the directory name
 *
 */
$.fn.getDirectory = function() {

	var urlToParse = window.location.href,
	    src;

	src = urlToParse.split( "?" );
	src = src[0].split( "/" );
	src = src[src.length - 2];

	return src;

};

/**
 * Add leading zero to single digit
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param int, the digit
 * @return string/int
 *
 */
$.fn.addLeadingZero = function( num ) {

    return num < 10  ? "0" + ( num ) : ( num );

};

/**
 * Display elements from array properly
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param array, the array to parse
 * @return string
 *
 */
$.fn.parseArray = function( arr ) {

    var result = "";

    if ( $.isArray( arr ) ) {

        for ( var i = 0; i < arr.length; i++ ) {

            if ( arr.length === 1 ) {

                result += arr[0];

            } else {

                if (i === arr.length - 1 ) {

                    result += arr[i];

                } else {

                    result += arr[i] + ", ";

                }

            }

        }

    } else {

        result = arr;

    }

    return result;

};

/**
 * Display elements from array properly as images
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param array, the array to parse
 * @return string
 *
 */
$.fn.parseArrayImg = function( arr ) {

    var result = "";

    if ( $.isArray( arr ) ) {

        for ( var i = 0; i < arr.length; i++ ) {

            result += "<img src=\"assets/img/"+ arr[i] +"\" /> ";

        }

    } else {

        result = "<img src=\"assets/img/"+ arr +"\" /> ";

    }

    return result;

};

/**
 * Strips script tags from string
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param string, the string to strip script tags
 * @return string
 *
 */
 $.fn.stripScript = function ( str ) {

   if ( str !== "" || str !== undefined ) {

       var results = $( "<span>" +  $.trim( str ) + "</span>" );

       results.find( "script,noscript,style" ).remove().end();

       return results.html();

   }

   return str;

 };

/**
 * Check for WebM support
 * @since 2.4.2
 *
 * @author Ethan S. Lin
 * @param none
 * @return bool
 *
 */
 $.fn.supportWebm = function () {

     return !!document.createElement( 'video' )
                    .canPlayType( 'video/webm; codecs="vp8.0, vorbis"' );

 };

 /**
 * Check for MP4 support
 * @since 2.5.8
 *
 * @author Ethan S. Lin
 * @param none
 * @return bool
 *
 */
 $.fn.supportMp4 = function () {

     return !!document.createElement( 'video' )
                    .canPlayType( 'video/mp4; codecs="avc1.4D401E, mp4a.40.2"' );

 };

/**
 * Get program directory name
 * @since 2.4.2
 * @updated 2.5.1
 *
 * @author Ethan S. Lin
 * @param none
 * @return string
 *
 */

$.fn.getProgramDirectory = function() {

    var url = window.location.href.split( "/" );

    if ( url[4] === undefined ) { return ""; }

    return url[4];

};

/**
 * Check table of content position and scroll is out of view
 * @since 2.7.0
 *
 * @author Ethan S. Lin
 *
 * @param none
 * @return void
 *
 */
 $.fn.autoscroll = function() {
 
    var currentItemPos = Math.floor( $( this ).position().top );
    
    if ( currentItemPos < 32 || currentItemPos >= 488 ) {

        $("#selectable").scrollTo( $(this), { duration: 500, offsetTop : ( $("#selectable")[0].clientHeight / 2 + $(this).height() ) } );
           
    }

 };

/**
 * Scroll to target
 * @since 2.7.0
 *
 * @author Ethan S. Lin
 * @param object, object, function
 * @return function
 *
 */
$.fn.scrollTo = function( target, options, callback ) {
     
    if ( typeof options === 'function' && arguments.length === 2 ) {
        
        callback = options;
        options = target;
      
    }
    
    var settings = $.extend( {
        
        scrollTarget  : target,
        offsetTop     : 50,
        duration      : 500,
        easing        : 'swing'
        
    }, options );
  
  return this.each( function() {
      
    var scrollPane = $( this );
    var scrollTarget = ( typeof settings.scrollTarget === "number" ) ? settings.scrollTarget : $( settings.scrollTarget );
    var scrollY = ( typeof scrollTarget === "number" ) ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt( settings.offsetTop );
    
    scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function() {
        
        if ( typeof callback === 'function' ) {
          
          callback.call(this);
          
        }
      
    } );
    
  });
  
};

/**
 * Select the item the table of content via button click
 * @since 2.8.0
 *
 * @author Ethan S. Lin
 * @param obj
 * @return void
 *
 */
$.fn.selectItem = function ( itemToSelect ) {
    
    if ( !tocClick ) {
        
        $( ".ui-selected", this ).not( itemToSelect ).removeClass( "ui-selected" ).addClass( "ui-unselecting" );
        $( itemToSelect ).not( ".ui-selected" ).addClass( "ui-selected" );
        
    } else {
        
        tocClick = false;
        
    }
    
};

/**
 * convert special character to html entities
 * @since 2.8.0
 *
 * @author Ethan S. Lin
 * @param str
 * @return str
 *
 */
$.fn.htmlEntities = function( str ) {
    
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    
};

/**
 * Listen to globla keyboard event
 * @since 2.8.0
 *
 * @author Ethan S. Lin
 * @param none
 * @return void
 *
 */
$.fn.keyboardEvents = function() {

    $( document ).keydown( function(e) {
        
        if ( mediaPlayer !== null ) {
            
            switch ( e.which ) {
                
                case 32:
                
                if ( mediaPlayer.paused() ) {
                    
                    mediaPlayer.play();
                    
                } else {
                    
                    mediaPlayer.pause();
                    
                }
                
                e.preventDefault();
                
                break;
                
            }
        
        }
        
    } );
    
};