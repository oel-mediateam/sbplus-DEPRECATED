/*
 * Storybook Plus
 *
 * @author: Ethan Lin
 * @url: https://github.com/oel-mediateam/sbplus
 * @version: 2.5.8
 * Released Wednesday, November 5, 2014
 *
 * @license: The MIT License (MIT)
 * Copyright (c) 2014 UW-EX CEOEL
 *
 */

/* global videojs */
/* global MediaElementPlayer */
/* global kWidget */

// global variable declarations
var topicCount = 0,
    counter = 0,
    previousIndex = 0,
    tocIndex = 0,
    noteArray,
    topicSrc,
    topicTitle,
    imgPath,
    slideImgFormat = "png",
    media = "Slide",
    enabledNote = false,
    version,
    imgCaption;

var questions,
    quizDetected = false;

var PROFILE,
    lessonTitle,
    instructor,
    duration;

var videoPlayer = null,
    audioPlayer,
    firstAudioLoad = false,
    audioPlaying = false,
    sources;

var ROOT_PATH = "https://media.uwex.edu/content/media/storybook_plus_v2/";

var tech = navigator.userAgent;
var IS_CHROME = (/Chrome/i).test( tech );
var IS_WINDOWS = (/Windows/i).test( tech );
// var IS_CHROME_39 = (/chrome\/[3][9]/i).test( tech );

// when document finished loading and ready
$( document ).ready( function() {

    /*
var ua = navigator.userAgent,
        checker = {

            ios: ua.match( /(iPhone|iPod|iPad)/i ),
            android: ua.match( /Android/i ),
            blackberry: ua.match( /BlackBerry/i )

        };

    var mobile = ( $.fn.getParameterByName( "m" ) === "0" ) ? false : true;

    if ( ( checker.ios || checker.blackberry || checker.android ) && mobile ) {

        var location = window.location.href,
            locTemp;

        locTemp = location.substr( location.indexOf( "." ) );
        location = "http://mediastreamer" + locTemp + "?m=0";

        $( "body" ).html( "<div class=\"mobile\"><a href=\"" + location + "\" target=\"_blank\"><img src=\"https://mediastreamer.doit.wisc.edu/uwli-ltc/media/storybook_plus/img/view_on_full_site.png\" width=\"450px\" height=\"315px\" alt=\"Launch Presentation in New Window\" border=\"0\" /></a></div>" );

        return false;

    }
*/

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

    $.ajaxSetup( {

        url: file,
        type: 'GET',
        dataType: 'xml',
        accepts: 'xml',
        content: 'xml',
        contentType: 'xml; charset="utf-8"',
        cache: false

    } );

    $.ajax( {

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
        NOTE = $.fn.stripScript( SETUP.find( "note" ).text() ),
        SLIDEFORMAT = $.fn.stripScript( SETUP.find('slideImgFormat').text() );

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

    // check note presence
    if ( NOTE.length ) {

        if ( NOTE === "yes" || NOTE === "y" ) {

            enabledNote = true;

        }

    }

    // check image file format
    if ( SLIDEFORMAT.length ) {

        slideImgFormat = SLIDEFORMAT;

    }

    // assign values to variables
    topicSrc = [];
    topicTitle = [];
    noteArray = [];
    questions = [];

    // loop through each topic node to get lesson topics
    // display each topic to web page as well
    TOPIC.each( function() {

        topicTitle[topicCount] = $.trim( $( this ).attr( 'title' ) );
        topicSrc[topicCount] = $.trim( $( this ).attr( 'src' ) );

        if ( enabledNote ) {

            noteArray[topicCount] = $.fn.stripScript( $( this ).find( "note" ).text() );

        }

        if ( topicSrc[topicCount] === "quiz" ) {

            var questionNode = $.fn.stripScript( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "question" ).text() ),
                questionImg = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "question" ).attr( "img" ) ),
                questionAudio = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "question" ).attr( "audio" ) ),
                choiceNode = $.fn.stripScript( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "choice" ).text() ),
                choiceImg = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "choice" ).attr( "useImg" ) ),
                wrongFeedbackNode = $.fn.stripScript( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "wrongFeedback" ).text() ),
                correctFeedbackNode = $.fn.stripScript( XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('correctFeedback').text() ),
                quizTypeAttr = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).attr( "type" ) ),
                answerNode = $.fn.stripScript( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "answer" ).text() );

            var quiz = {};

            quizDetected = true;

            quiz.id = topicCount;
            quiz.type = quizTypeAttr;
            quiz.question = questionNode;

            if ( questionImg !== "" ) {

                quiz.img = questionImg;

            } else {

                quiz.img = "";

            }

            if ( questionAudio !== "" ) {

                quiz.audio = questionAudio;

            } else {

                quiz.audio = "";

            }

            if ( choiceImg !== "" ) {

                quiz.choiceImg = choiceImg;

            } else {

                quiz.choiceImg = "";

            }

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

    // call to setup the player
    $.fn.setupPlayer();

};

/**
 * Set up the player
 * @since 2.0.0
 * @updated 2.5.8
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.setupPlayer = function() {

    var directory = $.fn.getDirectory();
    var selfAssessmentIcon;

    version = ( $( "#storybook_plus_wrapper" ).attr( "data-version" ) === undefined ) ? "" : $( "#storybook_plus_wrapper" ).attr( "data-version" ).replace(/\./g, "");

    $( document ).attr( "title", lessonTitle );

    // initialy hide error message container
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

    if ( enabledNote === false && quizDetected === false && version < 230 ) {

        $( "#storybook_plus_wrapper" ).addClass( "noteDisabled" );

    } else if ( ( enabledNote === false && quizDetected === true ) || version >= 230 ) {

        var dir = $.fn.getProgramDirectory();

        var logo = "<img src=\"" + ROOT_PATH +"sources/img/uw_ex_ceoel_logo.svg\" width=\"250\" height=\"108\" alt=\"University of Wisconsin-Extension Division of Continuing Education, Outreach &amp; E-Learning\" border=\"0\" />";

        $( "#storybook_plus_wrapper" ).addClass( "withQuiz" );

        switch( dir ) {

                case "smgt":
                    logo = "<img src=\"" + ROOT_PATH + "sources/img/uw_smgt_logo.svg\" width=\"250\" height=\"108\" alt=\"University of Wisconsin Sustainable Management\" border=\"0\" />";
                break;

                case "hwm":
                    logo = "<img src=\"" + ROOT_PATH + "sources/img/uw_hwm_logo.svg\" width=\"250\" height=\"108\" alt=\"University of Wisconsin Health &amp; Wellness Management\" border=\"0\" />";
                break;

                case "himt":
                    logo = "<img src=\"" + ROOT_PATH + "/sources/img/uw_himt_logo.svg\" width=\"250\" height=\"108\" alt=\"University of Wisconsin Health Information Management &amp; Technology\" border=\"0\" />";
                break;

                case "il":
                    logo = "<img src=\"" + ROOT_PATH + "sources/img/uw_il_logo.svg\" width=\"250\" height=\"108\" alt=\"University of Wisconsin Independent Learning\" border=\"0\" />";
                break;

                case "flx":
                    logo = "<img src=\"" + ROOT_PATH + "sources/img/uw_flx_logo.svg\" width=\"250\" height=\"108\" alt=\"University of Wisconsin Flexible Option\" border=\"0\" />";
                break;

                case "bps":
                    logo = "<img src=\"" + ROOT_PATH + "sources/img/uw_bps_logo.svg\" width=\"250\" height=\"108\" alt=\"University of Wisconsin Bachelor of Professional Studies in Organization Leadership and Communication\" border=\"0\" />";
                break;

        }

        if ( enabledNote === false ) {
            $( "#note" ).addClass( "noNotes" ).html( "<div class=\"logo\">" + logo + "</div>" );
        }

    }

	// loop to populate the table of contents
    $.each( topicTitle, function( i ) {

		if ( topicSrc[i] === "quiz" ) {

		    selfAssessmentIcon = " <span class=\"icon-assessement light\"></span>";

		} else {

    		selfAssessmentIcon = "";

		}

		$( "#selectable" ).append( "<li class=\"ui-widget-content\" title=\"" + topicTitle[i] + "\">" + "<div class=\"slideNum\">" + $.fn.addLeadingZero( i + 1 ) + ".</div><div class=\"title\">" + topicTitle[i] + selfAssessmentIcon + "</div></li>" );

	} );

	// set up the splash screen
    $( "#splash_screen" ).css( "background-image", "url(assets/splash.jpg)" );
    $( "#splash_screen" ).append( "<p>" + lessonTitle + "</p><p>" + instructor + "</p>" + ( ( duration !== 0 ) ? "<p><small>" + duration + "</small></p>" : "" ) + "<a class=\"playBtn\" href=\"#\"></a>" );

    // bind click event to splash screen
    $( "#splash_screen, #playBtn" ).on( "click", function() {

        $.fn.initializePlayer();
        return false;

    } );

    // download files
    $.fn.getDownloadableFile( directory, "mp3", "audio/mpeg" );
    $.fn.getDownloadableFile( directory, "pdf", "application/pdf" );

};

/**
 * Initialize the player
 * @since 2.0.0
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

    $( "#instructorName" ).html( "<a class=\"instructorName\" href=\"#\">" + instructor + "</a>" );

    // setup profile panel
    $( "#profile .photo" ).before( "<div class=\"profileCloseBtn\"><a id=\"profileClose\" href=\"#\">&times;</a></div>" );
    $( "#profile .bio" ).html( "<h2>" + instructor + "</h2>" + PROFILE );

    $( "#player" ).append( "<div id=\"progressing\"></div>" );

	// bind for profile panel open/close toggle
    $( "#info, a.instructorName, #profileClose" ).on( "click", function() {

        if ( $( "#profile" ).is(":visible") ) {

            $( "#profile" ).fadeOut( 300 );

        } else {

            $( "#profile" ).fadeIn( 300 );

        }

        return false;

    } );

	// setup toc selectable items
	$( "#selectable li:first" ).addClass( "ui-selected" );
    $( "#selectable" ).selectable( {

        stop: function() {

            tocIndex = Number( $( ".ui-selected .slideNum" ).html().replace(".","") ) - 1;

            if ( tocIndex !== previousIndex ) {

                $.fn.loadSlide( topicSrc[tocIndex], tocIndex );
                previousIndex = tocIndex;

            }
        }

    } );

    // bind left click event
    $( "#leftBtn" ).on( "click", function() {

        counter--;

        if ( counter < 0 ) {
            counter = topicCount - 1;
        }

        $.fn.loadSlide( topicSrc[counter], counter );
        previousIndex = counter;

        return false;

    } );

    // bind right click event
    $( "#rightBtn" ).on( "click", function() {

        counter++;

        if ( counter > topicCount - 1 ) {
            counter = 0;
        }

        $.fn.loadSlide( topicSrc[counter], counter );
        previousIndex = counter;

        return false;

    });

    // add the zoom boutton to the control after the slide status
    if ( enabledNote === true || quizDetected === true || version >= 230 ) {

        $( "#control" ).append( "<span id=\"magnifyBtn\"><span class=\"icon-expand\" title=\"Expand\"></span></span>" );

        if ( $( "#storybook_plus_wrapper" ).hasClass( "withQuiz" ) ) {

            $( "#magnifyBtn" ).before( "<span id=\"tocBtn\"><span class=\"toc\" title=\"Toggle Table of Contents\"></span></span>" );

        } else {

            $( "#magnifyBtn" ).before( "<span id=\"notesBtn\"><span class=\"notes\" title=\"Toggle Notes\"></span></span><span id=\"tocBtn\"><span class=\"toc\" title=\"Toggle Table of Contents\"></span></span>" );

        }

        $.fn.bindImgMagnify();
        $.fn.bindNoteSlideToggle();
        $.fn.bindTocSlideToggle();

    }

    // call to load the first slide
    $.fn.loadSlide( topicSrc[0], counter );

    // load and set the instructor picture
    $.fn.loadProfilePhoto();

    // display the player
    $( "#player" ).show();

};

/**
 * Load current slide
 * @since 2.0.0
 * @updated 2.5.1
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

    if ( slideSource !== "quiz" ) {

        slideSource = slideSource.substring( 0, slideSource.indexOf( ":" ) + 1 );

        if ( slideSource === "kaltura:" ) {

            if ( srcName.split( ":" ).length !== 1 ) {
                srcName = srcName.split( ":" );
            }

        }

    }

    if ( slideSource !== 'video:' && slideSource !== 'kaltura:' && slideSource !== 'youtube:' && slideSource !== 'vimeo:' ) {
        $( "#progressing" ).fadeIn();

    }

    if ( $( "#slideNote" ).hasClass( "quizSlide" ) ) {

        $( "#slideNote" ).removeClass( "quizSlide" );

    }

    if ( videoPlayer !== null ) {
        videoPlayer.dispose();
        videoPlayer = null;
        $( '#vp' ).empty().hide();
    }

    // if audio is playing
    if ( audioPlaying ) {

        try {

            audioPlayer.pause();

        } catch(e) { }

        $( "#ap" ).hide();

        audioPlaying = false;

    }

    //$( "#slide" ).html( "" ).show();
    $( "#slide" ).html( "" );

    switch ( slideSource ) {

        case "image:":

            img = new Image();

            imgPath = "assets/slides/" + srcName + "." + slideImgFormat;
            imgCaption = $( "#selectable li .title" ).get( sNum ).innerHTML;

            $( img ).load( function() {

                $( this ).hide();
                $( "#slide" ).html( "<div id=\"img\"></div>" );
                $( "#slide #img" ).html( img );
                $( this ).fadeIn();
                $( "#progressing" ).fadeOut();

            } ).error( function() {

                $.fn.displayErrorMsg( "image not found!", "Expected image: " + imgPath );

            } ).attr( {
                'src': imgPath,
                'border': 0
            } );

        break;

        case "image-audio:":

            img = new Image();

            imgPath = "assets/slides/" + srcName + "." + slideImgFormat;
            imgCaption = $( "#selectable li .title" ).get( sNum ).innerHTML;

            $( img ).load( function() {

                $( this ).hide();
                $( "#slide" ).html( "<div id=\"img\"></div>" );
                $( "#slide #img" ).html( img );
                $( this ).fadeIn();
                $( "#progressing" ).fadeOut();

                if ( !audioPlaying ) {

                    if ( $.fn.fileExists( "assets/audio/" + srcName, "mp3", "audio/mpeg" ) ) {

                        $( "#ap" ).show();

                        if (firstAudioLoad !== true) {

                		    $.fn.loadAudioPlayer( "#apc", srcName );
                            firstAudioLoad = true;

    					} else {

    						sources = [{src: "assets/audio/" + srcName + ".mp3", type: "audio/mpeg"}];
    						audioPlayer.setSrc( sources );

    					}

                    } else {

                        $.fn.displayErrorMsg( "audio file not found!", "Expected file: assets/audio/" + srcName + ".mp3" );

                    }

                    audioPlaying = true;

                }

            } ).error( function() {

                $.fn.displayErrorMsg( "image not found!", "Expected image: " + imgPath );

            } ).attr( {

                'src': imgPath,
                'border': 0

            } );

        break;

        case "video:":

            $.fn.setupVideoPlayer( 'video', srcName );

        break;

        case "youtube:":

            $( "#slide" ).html( "<iframe width=\"640\" height=\"360\" src=\"https://www.youtube.com/embed/" + srcName + "?modestbranding=1&theme=light&color=white&showinfo=0&autoplay=1&controls=2&fs=0&html5=1&autohide=1&rel=0&iv_load_policy=3\" frameborder=\"0\"></iframe>" ).promise().done();

        break;

        case "vimeo:":

            $( "#slide" ).html( "<iframe width=\"640\" height=\"360\" src=\"//player.vimeo.com/video/" + srcName + "?portrait=0&color=ffffff&autoplay=1&fullscreen=0\" frameborder=\"0\"></iframe>" ).promise().done();

        break;

        case "kaltura:":

            $.fn.setupVideoPlayer( 'kaltura', srcName );

        break;

        case "swf:":

            $( "#slide" ).html( "<object width=\"640\" height=\"360\" type=\"application/x-shockwave-flash\" data=\"assets/swf/" + srcName + ".swf\"><param name=\"movie\" value=\"assets/swf/" + srcName + ".swf\" /><div id=\"errorMsg\"><p>Error: Adobe Flash Player is not enabled or installed!</p><p>Adobe Flash Player is required to view this slide. Please enable or <a href=\"http://get.adobe.com/flashplayer/\" target=\"_blank\">install Adobe Flash Player</a>.</p></div></object>" ).promise().done( function() {

                $( "#progressing" ).fadeOut();

            } );

        break;

        case "quiz":

            $( "#slideNote" ).addClass( "quizSlide" );
            $.fn.setupQuiz( sNum );
            $( "#progressing" ).fadeOut();

        break;

        default:

            $.fn.displayErrorMsg( "unknow slide type!", "Please double check the XML file." );

        break;

    }

    if ( enabledNote ) {

        $( this ).loadNote( sNum );

    }

    $( this ).updateSlideNum( sNum );

};

/**
 * Setup videojs player
 * @since 2.4.0
 * @updated 2.5.7
 *
 * @author Ethan S. Lin
 *
 * @param strings, slide type and source
 * @return void
 *
 */
 $.fn.setupVideoPlayer = function ( type, src ) {

     var playerID = "vpc";

    switch( type ) {

        case "video":

            var subtitle = ( ( $.fn.fileExists( "assets/video/" + src, "vtt", "text/vtt" ) ) ? "<track kind=\"subtitles\" src=\"assets/video/" + src + ".vtt\" srclang=\"en\" label=\"English\">" : "" );
            var mp4Src = "<source src=\"assets/video/" + src + ".mp4\" type=\"video/mp4\" />";

            $( "#vp" ).html( "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\">" + mp4Src + subtitle + "</video>" ).promise().done( function() {

                $( "#progressing" ).fadeOut();
                $.fn.loadVideoJsPlayer(playerID);

            } );


        break;

        case "kaltura":

            var entryId, captionId, captionExt, captionLang, flavors = {}, video;

            kWidget.getSources( {
                'partnerId': 1660872,
                'entryId': src,
                'callback': function( data ) {

                    entryId = data.entryId;
                    captionId = data.captionId;
                    captionExt = data.captionExt;
                    captionLang = data.captionLang;

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
                    video = "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\">";

                    // set low res vid if available
                    if ( flavors.low !== undefined ) {
                        video += "<source src=\"" + flavors.low + "\" type=\"video/mp4\" data-res=\"low\" />";
                    }

                    // set normal res vid
                    video += "<source src=\"" + flavors.normal + "\" type=\"video/mp4\" data-res=\"normal\" data-default=\"true\" />";

                    // set high res vid if available
                    if ( flavors.low !== undefined ) {
                        video += "<source src=\"" + flavors.high + "\" type=\"video/mp4\" data-res=\"high\" />";
                    }

                    if ( flavors.webm !== undefined && $.fn.supportWebm() ) {
                        video += "<source src=\"" + flavors.webm + "\" type=\"video/webm\" />";
                    }

                    // set caption track if available
                    if ( captionId !== null ) {
                        video += "<track kind=\"subtitles\" src=\"https://cdnapisec.kaltura.com/api_v3/index.php/service/caption_captionAsset/action/serve/captionAssetId/" + captionId + "\" srclang=\"en\" label=\"English\">";
                    }

                    // closing video tag
                    video += "</video>";

                    // insert video tag to #vp element
                    $( "#vp" ).html( video ).promise().done( function() {

                        $( "#progressing" ).fadeOut();

                    } );

                    $.fn.loadVideoJsPlayer(playerID);

                } // end callback

            } ); // end kWidget

        break;

        default:
            $.fn.displayErrorMsg( "Kaltura video error!", "Please double check your XML file." );
        break;

    }

 };

/**
 * load videojs player
 * @since 2.4.1
 * @updated 2.5.7
 * @author Ethan S. Lin
 *
 * @param strings, video element id
 * @return void
 *
 */
$.fn.loadVideoJsPlayer = function( playerID ) {

    var options = {

        techOrder: ["html5", "flash"],
        "width": 640,
        "height": 360,
        "controls": true,
        "autoplay": true,
        "preload": "auto",
        plugins: { resolutions: true }

    };

    // console.log($.fn.supportMp4());

    if ( $.fn.supportMp4() === false || ( IS_WINDOWS && IS_CHROME ) ) {

        options.techOrder = ["flash", "html5"];
        options.plugins = null;

    }

    $( "#vp" ).fadeIn();

    videojs( playerID, options, function() {

        videoPlayer = this;
        this.progressTips();
        this.removeChild('FullscreenToggle');

    } );

    videojs.options.flash.swf = ROOT_PATH + "sources/videoplayer/video-js.swf";

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
    $( "#slide" ).html( "<div id=\"quiz\"><div class=\"header\"><span class=\"icon-assessement\"></span> Self-Assessment</div>" );

    if ( !questions[index].taken ) {

        if ( questions[index].img !== "") {

            var img = new Image();

            imgPath = "assets/img/" + questions[index].img;

            $( img ).load( function() {

                $( "#quiz" ).append( "<div class=\"question\">" + questions[index].question + "</div>" );
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

            $( "#quiz" ).append( "<div class=\"question\">" + questions[index].question + audio + "</div>" );
            $.fn.displayAnswerChoices( index );

        }

    } else {

        $.fn.showFeedback( index );

    }

};

/**
 * Display current self-assessment answer choice or types
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

            $( "#quiz" ).append( "<div class=\"answerArea\"><label for=\"t\"><input id=\"t\" type=\"radio\" name=\"tf\" value=\"true\" /> True</label><label for=\"f\"><input type=\"radio\" id=\"f\" name=\"tf\" value=\"false\" /> False</label></div>" );

        break;

        case "fib":

            $( "#quiz" ).append( "<div class=\"answerArea\"><input type=\"text\" id=\"saAns\" /></div>" );

        break;

        case "mc":

            var type = "radio";
            var name = "mc";

            answerLength = questions[index].answer.length;

            $( "#quiz" ).append( "<div class=\"answerArea\">" );

            if ( answerLength > 1 ) {

                type = "checkbox";
                name = "ma";

            }

            if ( questions[index].choiceImg === "true" ) {

                for ( var i = 0; i < questions[index].choice.length; i++ ) {

                    $( ".answerArea" ).append( "<label class=\"img_choice\"for=\"" + i + "\"><input id=\"" + i + "\" type=\"" + type  + "\" name=\"" + name + "" + "\" value=\"" + questions[index].choice[i] + "\" /> <img src=\"assets/img/" + questions[index].choice[i] + "\" /></label>" );

                }

            } else {

                for ( var j = 0; j < questions[index].choice.length; j++ ) {

                    $( ".answerArea" ).append( "<label for=\"" + j + "\"><input id=\"" + j + "\" type=\"" + type  + "\" name=\"" + name + "" + "\" value=\"" + questions[index].choice[j] + "\" /> " + questions[index].choice[j] + "</label>" );

                }

            }

            $( "#quiz" ).append( "</div>" );

        break;

        case "sa":

            $( "#quiz" ).append( "<div class=\"answerArea\"><textarea id=\"saAns\"></textArea></div>" );

        break;

        default:

            quizError = true;
            $.fn.displayErrorMsg( "unknow question type!", "Please double check the topic XML file." );

        break;

    }

    if ( !quizError ) {

        $( "#quiz" ).append( "<div class=\"submitArea\"><a id=\"check\" rel=\"" + index + "\" href=\"#\">SUBMIT</a></div>" );
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

                            if ( stuAnswer === questions[index].answer[0] ) {

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
 * Display current self-assessment feedback
 * @since 2.0.0
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

    $( "#slide" ).html( "<div id=\"quiz\"><div class=\"header\"><span class=\"icon-assessement\"></span> Self-Assessment Feedback</div>" );

    if ( questions[index].type !== "sa" ) {

        if ( questions[index].correct ) {

            $( "#quiz" ).append( "<p class=\"quizCorrect\"><span class=\"icon-checkmark\"></span> CORRECT</p>" );

        } else {

            $( "#quiz" ).append( "<p class=\"quizIncorrect\"><span class=\"icon-notification\"></span> INCORRECT</p>" );

        }

    }

    if ( questions[index].img !== "" ) {

        questionImg = "<img src=\"assets/img/" + questions[index].img + "\" alt=\"" + questions[index].question + "\" border=\"0\" />";

    }

    if ( questions[index].audio !== "") {
        audio = "<audio controls><source src=\"assets/audio/" + questions[index].audio + ".mp3\" type=\"audio/mpeg\" /></audio>";
    }

    $( "#quiz" ).append( "<div class=\"question\">" + questions[index].question + questionImg + audio + "</div>" );

    if ( questions[index].choiceImg === "true" ) {

        $( "#quiz" ).append( "<div class=\"result\"><p><strong>Your answer</strong>:<br />" + $.fn.parseArrayImg( questions[index].stuAnswer ) + "</p></div>" );
        $('.result').append('<p><strong>Correct answer</strong>:<br />' + $.fn.parseArrayImg( questions[index].answer ) + '</p>');

    } else {

        $( "#quiz" ).append( "<div class=\"result\"><p><strong>Your answer</strong>: " + $.fn.parseArray( questions[index].stuAnswer ) + "</p></div>" );
        $('.result').append('<p><strong>Correct answer</strong>: ' + $.fn.parseArray( questions[index].answer ) + '</p>');

    }

    if ( questions[index].type !== "sa" ) {

        if ( questions[index].correct ) {

            if ( String( questions[index].correctFeedback ) !== "" ) {

                $('.result').append('<p><strong>Feedback:</strong> ' + questions[index].correctFeedback + '</p>');

            }

        } else {

            if (questions[index].type === "mc") {

                var feedback = questions[index].wrongFeedback[questions[index].incorrectIndex];

                if ( feedback === undefined ) {
                    feedback = questions[index].wrongFeedback;
                }

                if ( String( feedback ) !== "" ) {

                    $('.result').append('<p><strong>Feedback:</strong> ' + feedback + '</p>');

                }

            } else {

                if ( String( questions[index].wrongFeedback ) !== "" ) {

                    $('.result').append('<p><strong>Feedback:</strong> ' + questions[index].wrongFeedback + '</p>');

                }

            }

        }

    }

};

/**
 * Load audio player
 * @since 2.1.0
 * @updated 2.5.1
 *
 * @author Ethan S. Lin
 * @param strings, id and source name
 * @return void
 *
 */
$.fn.loadAudioPlayer = function( id, srcName ) {

    var width = "100%", height = 30;

    audioPlayer = new MediaElementPlayer( id, {

		audioWidth: width,
		audioHeight: height,
		startVolume: 0.8,
		loop: false,
		enableAutosize: true,
		iPadUseNativeControls: false,
		iPhoneUseNativeControls: false,
		AndroidUseNativeControls: false,
		pauseOtherPlayers: true,
		type: "audio/mpeg",
		success: function( me ) {

			sources = [{src: "assets/audio/" + srcName + ".mp3", type: "audio/mpeg"}];
			me.setSrc( sources );
			me.load();

            me.addEventListener( "play", function() {

                $.fn.bindAudioPlayerFadeInOut();

            } );

            me.addEventListener( "ended", function() {

                $.fn.unbindAudioPlayerFadeInOut();

            } );

		}

	} );

};

/**
 * Fade in and out audio player
 * @since 2.2.0
 *
 * @author Ethan S. Lin
 * @param none
 * @return void
 *
 */
$.fn.bindAudioPlayerFadeInOut = function() {

    $( "#ap" ).delay( 3000 ).fadeOut( "slow" );

    $( "#img, #ap" ).on( "mouseenter", function() {

        $( "#ap" ).stop(true,true).fadeIn( "slow" );

    } );

    $( "#img, #ap" ).on( "mouseleave", function() {

        $( "#ap" ).stop(false,true).delay( 1000 ).fadeOut( "slow" );

    } );

};

/**
 * Unbind audio player fade in and out
 * @since 2.5.1
 *
 * @author Ethan S. Lin
 * @param none
 * @return void
 *
 */
$.fn.unbindAudioPlayerFadeInOut = function() {

    $( "#ap" ).fadeIn( "fast" );
    $( "#img, #ap" ).unbind( "mouseenter" );
    $( "#img, #ap" ).unbind( "mouseleave" );

};

/**
 * Load notes for the current slide
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param int, current topic number
 * @return void
 *
 */
$.fn.loadNote = function( num ) {

    var note = noteArray[num];

	if ( !$( "#slideNote" ).hasClass( "quizSlide" ) ) {

    	$( "#note" ).html( note ).hide().fadeIn( "fast" );

    	if ( $( "#storybook_plus_wrapper" ).hasClass( "magnified" ) ) {

            $( "#notesBtn" ).show();

        }

	} else {
    	$( "#notesBtn" ).hide();
	}

	if ( $( "#note" ).find( "a" ).length ) {

		$( "#note a" ).each( function() {
			$( this ).attr( "target", "_blank" );

        });

    }

};

/**
 * Update the current slide number indicator
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param int, current topic number
 * @return void
 *
 */
$.fn.updateSlideNum = function( num ) {

    var currentNum = num + 1;
    counter = num;

    $( "#selectable li" ).each( function() {
        $( this ).removeClass( "ui-selected" );
    } );

    $( "#selectable li:nth-child(" + currentNum + ")" ).addClass( "ui-selected" );
    $( "#currentStatus" ).html( media + " " + currentNum + " of " + topicCount );

};

/**
 * Magnify the current slide image and video
 * @since 2.0.0
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
            $( "#notesBtn, #tocBtn" ).hide();

        } else {

            $( "#storybook_plus_wrapper" ).addClass( "magnified" );
            $( this ).html( "<span class=\"icon-contract\" title=\"Contract\"></span>" );
            $( "#tocBtn" ).show();

            if ( !$( "#slideNote" ).hasClass( "quizSlide" ) ) {

                $( "#notesBtn" ).show();

            }

        }

    } );

};

/**
 * Slide notes up and down in expanded mode
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
        var pos  = 0;

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

        } );

    } );

};

/**
 * Loading the instructor profile image
 * @since 2.0.0
 * @update 2.5.8
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.loadProfilePhoto = function() {

    var img = new Image(),
        imgPath = "assets/pic.jpg";

    $( img ).load( function() {

        $( "#profile .photo" ).html( "<img src=\"" + imgPath + "\" alt=\"Instructor Photo\" border=\"0\" />" );

    } ).error( function() {

        $( "#profile .photo" ).html( "<img src=\"" + ROOT_PATH + "sources/img/profile.png\" width=\"200\" height=\"300\" alt=\"No Profile Photo\" border=\"0\" />" );

    } ).attr( {

        "src": imgPath,
        "border": 0

    } );

};

/**
 * Request downloadable files
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param strings, file name and extension
 * @return void
 *
 */
$.fn.getDownloadableFile = function( file, ext, contentType ) {

    var newURL = file,
        fileType = "Audio",
        downloadBar = $( "#download_bar ul" ),
        protocol = window.location.protocol;

	if ( protocol !== "http:" ) {
		var url = window.location.href;
		url = url.substr( 0, url.lastIndexOf( "/" ) + 1 ).replace( "https", "http" );
		newURL = url + file;
	}

	if ( ext === "pdf" ) {
		fileType = "Transcript";
	}

    if ( $.fn.fileExists( file, ext, contentType ) ) {

        downloadBar.append("<li><a href=\"" + newURL + "." + ext + "\" target=\"_blank\"><span class=\"icon-arrow-down\"><span> " + fileType + "</a></li>");

    }

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

    var selectionArray = arg.split("|");
    return selectionArray;

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
 * Check for file exisitance
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 *
 * @param strings, file path, extension, and content type
 * @return bool
 *
 */
$.fn.fileExists = function( file, ext, content_type ) {

    var exists,
        cType = content_type;

    switch ( ext ) {

        case "pdf":
            cType = "application/pdf";
        break;

    }

    $.ajax( {

        url: file + "." + ext,
        type: "HEAD",
        dataType: "text",
        contentType: cType,
        async: false,
        beforeSend: function( xhr ) {
            xhr.overrideMimeType( cType );
            xhr.setRequestHeader( "Accept", cType );
        },
        success: function() {
            exists = true;
        },
        error: function() {
            exists = false;
        }

    } );

    return exists;

};

/**
 * Parse the URL query parameter from the current page location
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @param string, the parameter to parse
 * @return string, the value of the parameter
 *
 */
$.fn.getParameterByName = function( param ) {

    var regexS = "[\\?&]" + param + "=([^&#]*)",
        regex = new RegExp( regexS ),
        results = regex.exec( window.location.href );

    param = param.replace( /[\[]/, "\\[" ).replace( /[\]]/, "\\]" );

    if ( results === null ) {
        return "";
    } else {
        return decodeURIComponent( results[1].replace( /\+/g, " " ) );
    }

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
 * Get for parent directory
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