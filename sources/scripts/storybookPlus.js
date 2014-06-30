/* global console */
/* global videojs */
/* global MediaElementPlayer */
/* global alert */

// global variable declarations
var pFontSize = 14,
    pLineHeight = 18,
    h1FontSize = 22,
    h1LineHeight = 26,
    h2FontSize = 20,
    h2LineHeight = 24,
    h3h4h5h6FontSize = 18,
    h3h4h5h6LineHeight = 22;
    
var topicCount = 0,
    counter = 1,
    previousIndex = 0,
    tocIndex = 0,
    XMLData,
    topicSrc,
    slideImgFormat = "png",
    imgPath,
    media = "Slide",
    enabledNote = false,
    imgCaption, quiz, quizArray, found = false,
    qNum = 0;
    
var SETUP, TOPIC, LESSON, PROFILE, INSTRUCTOR,
    LENGTH, NOTE, SLIDEFORMAT, lessonTitle, instructor,
    duration;
        
var audioPlayer,
    firstAudioLoad = false,
    audioPlaying = false,
    videoPlaying = false,
    sources;

$( document ).ready( function() {
	
    var ua = navigator.userAgent,
        checker = {
            iphone: ua.match( /(iPhone|iPod|iPad)/ ),
            blackberry: ua.match( /BlackBerry/ ),
            android: ua.match( /Android/ )
        };

    var mobile = ( $( this ).getParameterByName( "m" ) === "0" ) ? false : true;

    if ( ( checker.iphone || checker.ipod || checker.ipad || checker.blackberry || checker.android ) && mobile ) {

        var location = window.location.href,
            locIndex = location.indexOf( "." ),
            locTemp;

        locTemp = location.substr( locIndex );
        location = "http://mediastreamer" + locTemp + "?m=0";

        $( "body" ).html( "<div style=\"text-align:center; width:450px; height:315px;\"><a href=\"" + location + "\" target=\"_blank\"><img src=\"https://mediastreamer.doit.wisc.edu/uwli-ltc/media/storybook_plus/img/view_on_full_site.png\" width=\"450px\" height=\"315px\" alt=\"Launch Presentation in New Window\" border=\"0\" /></a></div>" );
        
        return false;

    }

    $( this ).getLessonContent( "assets/topic.xml" );

    // setup quiz
    function setupQuiz(num) {

        // loop to find the question
        while (!found || qNum === quizArray.length) {

            if (quizArray[qNum].id === num) {
                found = true;
            } else {
                qNum++;
            }

        }

        // build the question
        $('#slide').append('<div id="quiz"><div class="header">Quiz ' + (qNum + 1) + ' of ' + quizArray.length + '</div>');

        // give the quiz a second to build up
        $('#quiz').hide();
        $('#quiz').fadeIn();

        if (!quizArray[qNum].taken) {

            $('#quiz').append('<div class="question">' + quizArray[qNum].question + '</div>');

            if (quizArray[qNum].type === "t/f") {

                $('#quiz').append('<div class="answerArea"><label for="t"><input id="t" type="radio" name="tf" value="true" /> True</label><label for="f"><input type="radio" id="f" name="tf" value="false" /> False</label></div>');

            } else if (quizArray[qNum].type === "fib") {

                $('#quiz').append('<div class="answerArea"><textarea id="saAns"></textArea></div>');

            } else if (quizArray[qNum].type === "mc") {

                $('#quiz').append('<div class="answerArea">');

                for (var i = 0; i < quizArray[qNum].choice.length; i++) {
                    $('.answerArea').append('<label for="' + i + '"><input id="' + i + '" type="radio" name="mc" value="' + quizArray[qNum].choice[i] + '" /> ' + quizArray[qNum].choice[i] + '</label>');
                }

                $('#quiz').append('</div>');

            } else if (quizArray[qNum].type === "sa") {

                $('#quiz').append('<div class="answerArea"><textarea id="saAns"></textArea></div>');

            } else {

                $('#quiz').append('<div class="answerArea">ERROR!</div>');

            }

            $('#quiz').append('<div class="submitArea"><a id="check" rel="' + qNum + '" href="javascript:void(0)">SUBMIT</a></div>');

            $('#check').click(function () {

                var position = Number($(this).attr('rel'));
                var stuAnswer;

                if (quizArray[position].type === "t/f") {

                    stuAnswer = $('input:radio[name=tf]:checked').val();
                    if (stuAnswer === undefined) {
                        stuAnswer = "";
                    }

                } else if (quizArray[position].type === "fib") {

                    stuAnswer = $.trim($('#saAns').val());

                } else if (quizArray[position].type === "mc") {

                    stuAnswer = $('input:radio[name=mc]:checked').val();
                    quizArray[position].incorrectIndex = $('input:radio[name=mc]').index($('input:radio[name=mc]').filter(":checked"));

                    if (stuAnswer === undefined) {
                        stuAnswer = "";
                    }

                } else if (quizArray[position].type === "sa") {

                    stuAnswer = $.trim($('#saAns').val());

                } else {
                    $.trim(stuAnswer);
                }

                if (stuAnswer !== "") {

                    for (var i = 0; i < quizArray[position].answer.length; i++) {
						
						
						
                        if (quizArray[position].type === "fib") {
                            var index = 0;
                            
						for (index; index < quizArray[position].answer.length; index++) {
							if (stuAnswer.toLowerCase() === quizArray[position].answer[index].toLowerCase()) {
								quizArray[position].correct = true;
								break;
							}
						}

                        } else if (quizArray[position].type === "t/f") {

                            if (stuAnswer.toLowerCase() === quizArray[position].answer[i].toLowerCase()) {
                                quizArray[position].correct = true;
                            } else {
                                quizArray[position].correct = false;
                            }

                        } else if (quizArray[position].type === "mc") {
                            if (stuAnswer.toLowerCase() === quizArray[position].answer[i].toLowerCase()) {
                                quizArray[position].correct = true;
                            } else {
                                quizArray[position].correct = false;
                            }

                        }

                    }

                    quizArray[position].stuAnswer = stuAnswer;
                    quizArray[position].taken = true;

                    showFeedback(position);

                } else {
                    alert("Please answer the question before submitting.");
                }

            });

        } else {
            showFeedback(qNum);
        }

        $('#slide').append('</div>');

        // reset counter and flag for next quextion
        qNum = 0;
        found = false;

    } // end setupQuiz


    // display quiz feedback

    function showFeedback(position) {

        var correctAnswer = "";

        $('#slide').html('<div id="quiz"><div class="header">Quiz ' + (position + 1) + ' of ' + quizArray.length + ' Feedback</div>');

        if (quizArray[position].type !== "sa") {

            if (quizArray[position].correct) {
                $('#quiz').append('<p class="quizCorrect"><span class="icon-checkmark"></span> CORRECT</p>');
            } else {
                $('#quiz').append('<p class="quizIncorrect"><span class="icon-notification"></span> INCORRECT</p>');
            }

        }

        $('#quiz').append('<div class="question">' + quizArray[position].question + '</div>');
        $('#quiz').append('<div class="feedback"><p><strong>Your answer</strong>: ' + quizArray[position].stuAnswer + '</p>');

        for (var i = 0; i < quizArray[position].answer.length; i++) {

            if (i === quizArray[position].answer.length - 1) {
                correctAnswer += quizArray[position].answer[i];
            } else {
                correctAnswer += quizArray[position].answer[i] + ", ";
            }

        }

        $('.feedback').append('<p><strong>Correct answer</strong>: ' + correctAnswer + '</p></div>');

        if (quizArray[position].type !== "sa") {

            if (quizArray[position].correct) {
                $('.feedback').append('<p><strong>Feedback:</strong> ' + quizArray[position].correctFeedback + '</p>');
            } else {
                if (quizArray[position].type === "mc") {

                    var feedback = quizArray[position].wrongFeedback[quizArray[position].incorrectIndex];
                    if (typeof feedback === 'undefined') {
                        feedback = "";
                    }

                    $('.feedback').append('<p><strong>Feedback:</strong> ' + feedback + '</p>');
                } else {
                    $('.feedback').append('<p><strong>Feedback:</strong> ' + quizArray[position].wrongFeedback + '</p>');
                }
            }

        }

    } // end showFeedback

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
            $( this ).parseContent( xml );
        },
        error: function ( xhr, exception ) {
            $( this ).displayGetLessonError( xhr.status, exception );
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
    
    SETUP = $( xml ).find( "setup" );
    TOPIC = $( xml ).find( "topic" );
    LESSON = $.trim( SETUP.find( "lesson" ).text() );
    PROFILE = $.trim( $( xml ).find( "profile" ).text() );
    INSTRUCTOR = $.trim( SETUP.find( "instructor" ).text() );
    LENGTH = $.trim( SETUP.find( "length" ).text() );
    NOTE = $.trim( SETUP.find( "note" ).text() );
    SLIDEFORMAT = $.trim( SETUP.find('slideImgFormat').text() );
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
        if ( NOTE === "yes" || NOTE === 'y' ) {
            enabledNote = true;
        }
    }

    // check image file format
    if ( SLIDEFORMAT.length ) {
        slideImgFormat = SLIDEFORMAT;
    }
    
    // assign values to variables
    XMLData = $( xml );
    topicSrc = [];
    quizArray = [];

    // loop through each topic node to get lesson topics
    // display each topic to web page as well
    TOPIC.each( function() {
        
        var topicTitle = $( this ).attr( 'title' );
        
        topicSrc[topicCount] = $( this ).attr( 'src' );

        if ( topicSrc[topicCount] === "quiz" ) {
            
            var questionNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "question" ).text() ),
                choiceNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "choice" ).text() ),
                wrongFeedbackNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "wrongFeedback" ).text() ),
                correctFeedbackNode = $.trim( XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('correctFeedback').text() ),
                quizTypeAttr = XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).attr( "type" ),
                answerNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "answer" ).text() );
            
            quiz = {};
            quiz.id = topicCount;
            quiz.type = quizTypeAttr;
            quiz.question = questionNode;

            if ( choiceNode ) {
                quiz.choice = $( this ).splitSelections( choiceNode );
                quiz.wrongFeedback = $( this ).splitSelections( wrongFeedbackNode );
            } else {
                quiz.wrongFeedback = wrongFeedbackNode;
            }

            quiz.answer = $( this ).splitSelections( answerNode );
            quiz.stuAnswer = "";
            quiz.correct = false;
            quiz.correctFeedback = correctFeedbackNode;
            quiz.taken = false;
            
            // add current quiz to array
            quizArray.push( quiz );

        }
        
        // populate table of content
        $( "#selectable" ).append( "<li class=\"ui-widget-content\" title=\"" + topicTitle + "\">" + "<div class=\"slideNum\">" + ( ( ( topicCount + 1 ) < 10 ) ? "0" + ( topicCount + 1 ) : ( topicCount + 1 ) ) + ".</div><div class=\"title\">" + topicTitle + "</div></li>" );

        topicCount++;

    });
    
    // call to setup the player
    $( this ).setupPlayer();
    
};

/**
 * Set up the player
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.setupPlayer = function() {
    
    var directory = $( this ).getDirectory();
    
    $( document ).attr( "title", lessonTitle );
    
    if ( !enabledNote ) {
        $( "#storybook_plus_wrapper" ).addClass( "noteDisabled" );
    }
    
    // initialy hide error message container
    $( "#errorMsg" ).hide();
    
    // set up the splash screen
    $( "#splash_screen" ).css( "background-image", "url(assets/splash.jpg)" );
    $( "#splash_screen" ).append( "<p>" + lessonTitle + "</p><p>" + instructor + "</p>" + ( ( duration !== 0 ) ? "<p><small>" + duration + "</small></p>" : "" ) + "<a class=\"playBtn\" href=\"#\"></a>" );
    
    // bind click event to splash screen
    $( "#splash_screen, #playBtn" ).on( "click", function() {
        $.fn.initializePlayer();
        return false;
    } );
    
    // download files
    $( this ).getDownloadableFile( directory, "mp3", "audio/mpeg" );
    $( this ).getDownloadableFile( directory, "pdf", "application/pdf" );
    
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
    
    $.each( topicSrc, function( i ) {
	
		var tSrc = topicSrc[i].substring( 0, topicSrc[i].indexOf( ":" ) + 1 );
		
		if ( tSrc === "video:" || tSrc === "youtube:" ) {
			media = "Video";
		} else {
			media = "Slide";
			return false;
		}
		
	} );
    
    // hide the error msg and splash screen
    $( "#splash_screen" ).hide();
    
    // setup up player header
    $( "#lessonTitle" ).html( lessonTitle );
    $( "#instructorName" ).html( "<a class=\"instructorName\" href=\"#profile\">" + instructor + "</a>" );
    
    // setup profile panel
    $( "#profile .bio" ).html( "<p>" + instructor + "</p>" + PROFILE );
	
	// enable fancy box for profile panel
    $( "#info, a.instructorName" ).fancybox({
        helpers: {
            overlay: {
                css: {
                    'background': 'rgba(250, 250, 250, 0.85)'
                }
            }
        },
        padding: 0
    });
	
	// setup toc selectable items
	$( "#selectable li:first" ).addClass( "ui-selected" );
    $( "#selectable" ).selectable( {
    
        stop: function() {

            $( ".ui-selected", this ).each( function() {
                tocIndex = $( "#selectable li" ).index( this ) + 1;
            });

            if ( tocIndex !== previousIndex ) {
                $( this ).loadSlide( topicSrc[tocIndex - 1], tocIndex );
                previousIndex = tocIndex;
            }
        }

    } );
    
    // bind left click event
    $( "#leftBtn" ).on( "click", function() {

        counter--;

        if ( counter <= 0 ) {
            counter = topicCount;
        }

        $( this ).loadSlide( topicSrc[counter - 1], counter );

    } );
    
    // bind right click event
    $( "#rightBtn" ).on( "click", function() {
    
        counter++;
        
        if ( counter > topicCount ) {
            counter = 1;
        }

        $( this ).loadSlide( topicSrc[counter - 1], counter );

    });
    
    // note is enabled
    if (enabledNote) {

        // display current font size
        $('#fontSizeIndicator').html(pFontSize);

        // binding increasing and decreasing font size buttons
        $('#fontMinusBtn').on('click', function () {

            $.fn.adjustFontSize( "minus" );

        });

        // font plus button
        $('#fontPlusBtn').on('click', function () {

            $.fn.adjustFontSize( "plus" );

        });

    }
    
    // call to load the first slide
    $( this ).loadSlide( topicSrc[0], counter );

    // load and set the instructor picture
    $( this ).loadProfilePhoto();
    
    // display the player
    $( "#player" ).show();
    
};

/**
 * Load current slide
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 *
 * @param string and int, slide type and slide number
 * @return void
 *
 */
$.fn.loadSlide = function( sn, sNum ) {

    var currentNum, noteNum, img;
    var slideType = sn;
    var srcName = sn.substring( sn.indexOf( ":" ) + 1 ) ;
    
    if ( slideType !== "quiz" ) {
        slideType = sn.substring( 0, sn.indexOf( ":" ) + 1 );
    }

    sNum = ( sNum < 10 ) ? "0" + sNum : sNum;
    currentNum = Number( sNum ) - 1;
    noteNum = Number( sNum ) - 1;

    $( "#slide" ).html( "<div id=\"progressing\"></div>" );

    // if video is playing
    if ( videoPlaying ) {
    
        $( "#vp" ).html( "" );
        $( "#vp" ).hide();
        videoPlaying = false;
        
    }
    
    // if audio is playing
    if ( audioPlaying ) {
        
        try {
            audioPlayer.pause();
        } catch(e) { }
        
        if ( enabledNote ) {
        
            $( "#ap" ).hide();
            
            if ( $( "#note" ).hasClass( "cropped" ) ) {
            
                $( "#note" ).removeClass( "cropped" );
                
            }
            
        } else {
        
            $( "#apm" ).hide();
            
        }
        
        audioPlaying = false;

    }
    
    switch ( slideType ) {
        
        case "image:":
        
            img = new Image();

            imgPath = "assets/slides/" + srcName + "." + slideImgFormat;
            imgCaption = $( "#selectable li .title" ).get( currentNum ).innerHTML;
    
            $( img ).load( function() {
    
                $( this ).hide();
                $( "#slide" ).append( "<a id=\"img\" title=\"" + imgCaption + "\" href=\"" + imgPath + "\">" );
                $( "#slide #img" ).html( img );
                $( "#slide" ).append( "</a><div class=\"magnifyIcon\"></div>" );
                $( this ).fadeIn();
                $( this ).bindImgMagnify();
    
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
            imgCaption = $( "#selectable li .title" ).get( currentNum ).innerHTML;
    
            $( img ).load( function() {
    
                $( this ).hide();
                $('#slide').append('<a id="img" title="' + imgCaption + '"href="' + imgPath + '">');
                $('#slide #img').html(img);
                $('#slide').append('</a><div class="magnifyIcon"></div>');
                $(this).fadeIn();
                $( this ).bindImgMagnify();
    
                if ( !audioPlaying ) {
    
                    if ( enabledNote ) {
    					
    					if ( $.fn.fileExists( "assets/audio/" + srcName, "mp3", "audio/mpeg" ) ) {
                            
                            $( "#ap").show();
                            
                            if (firstAudioLoad !== true) {
    					    
                    		    $( this ).loadAudioPlayer( "#apc", srcName );
                                firstAudioLoad = true;
        						
        					} else {
        					    
        						sources = [{src: "assets/audio/" + srcName + ".mp3", type: "audio/mpeg"}];
        						audioPlayer.setSrc( sources );
        						
        					}
        					
        					$( "#note" ).addClass( "cropped" );
                            
                        } else {
                        
                            if ( $( "#note" ).hasClass( "cropped" ) ) {
            
                                $( "#note" ).removeClass( "cropped" );
                                
                            }
                            
                            $.fn.displayErrorMsg( "audio file not found!", "Expected file: assets/audio/" + srcName + ".mp3" );
                            
                        }
    
                    } else {
    
                        if ( $.fn.fileExists( "assets/aduio/" + srcName, "mp3", "audio/mpeg" ) ) {
                            
                            $( "#apm" ).show();
                            
                            if (firstAudioLoad !== true) {
    					    
                    		    $( this ).loadAudioPlayer( "#apcm", srcName );
                                firstAudioLoad = true;
        						
        					} else {
        					    
        						sources = [{src: "assets/audio/" + srcName + ".mp3", type: "audio/mpeg"}];
        						audioPlayer.setSrc( sources );
        						
        					}
                            
                        } else {
                        
                            $.fn.displayErrorMsg( "audio file not found!", "Expected file: assets/audio/" + srcName + ".mp3" );
                            
                        }
    
                    }
    
                    audioPlaying = true;
    
                }
    
            } ).error( function() {
    
                $.fn.displayErrorMsg( "image not found!", "Expected image: " + imgPath );
    
            }).attr({
            
                'src': imgPath,
                'border': 0
                
            });
        
        break;
        
        case "video:":
        
            var time = $.now(),
                playerID = "vpc" + time;
    
            $( "#vp" ).append( "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\" controls autoplay width=\"640\" height=\"360\">" + ( ( $.fn.fileExists( "assets/video/" + srcName, "vtt", "text/vtt" ) ) ? "<track kind=\"subtitles\" src=\"assets/video/" + srcName + ".vtt\" srclang=\"en\" label=\"English\" default>" : "" ) + "</video>" );
    
            if ( !videoPlaying ) {
            
                $( "#vp" ).show();
    
                videojs( playerID, {}, function() {
                
                    this.progressTips();
                    this.src( [
    					{type: "video/mp4", src:"assets/video/" + srcName + ".mp4"},
    					{type: "video/webm", src:"assets/video/" + srcName + ".webm"}
    				] );
    				
                } );
                
                videojs.options.flash.swf = "sources/videoplayer/video-js.swf";
    
                videoPlaying = true;
            
            }
        
        break;
                
        case "youtube:":
        
            $( "#slide" ).append( "<iframe width=\"640\" height=\"360\" src=\"http://www.youtube.com/embed/" + srcName + "?modestbranding=1&theme=light&color=white&showinfo=0&autoplay=1&controls=2&html5=1&autohide=1&rel=0\" frameborder=\"0\" allowfullscreen></iframe>" );
        
        break;
        
        case "swf:":
        
            $( "#slide" ).append( "<object width=\"640\" height=\"360\" type=\"application/x-shockwave-flash\" data=\"assets/swf/" + srcName + ".swf\"><param name=\"movie\" value=\"assets/swf/" + sn + ".swf\" /><div id=\"errorMsg\"><p>Error: Adobe Flash Player is not enabled or installed!</p><p>Adobe Flash Player is required to view this slide. Please enable or <a href=\"http://get.adobe.com/flashplayer/\" target=\"_blank\">install Adobe Flash Player</a>.</p></div></object>" );
        
        break;
        
        case "quiz":
        
            setupQuiz( currentNum );
        
        break;
        
        default:
        
            $.fn.displayErrorMsg( "unknow slide type!", "Please double check the XML file." );
        
        break;
        
    }
    
    $( "#progressing" ).hide();
    
    // load current slide note and update the slide number
    $( this ).loadNote( noteNum );
    $( this ).updateSlideNum( sNum );

};

/**
 * Load audio player
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @param strings, id and source name
 * @return void
 *
 */
$.fn.loadAudioPlayer = function( id, srcName ) {
    
    var width = 640, height = 30;
    
    if ( id === "#apcm" ) {
        width = 300;
        height = 0;
    }
    
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
			
		}
		
	} );
    
};

/**
 * Load notes for the current slide
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @param int, current topic number
 * @return void
 *
 */
$.fn.loadNote = function( num ) {

    var note = XMLData.find( "topic:eq(" + num + ")" ).find( "note" ).text();
	
	$( "#note" ).html( note );
	
	if ( $( "#note" ).find( "a" ).length ) {
	
		$( "#note a" ).each( function() {
			$( this ).attr( "target", "_blank" );
			
        });
	
    }

};

/**
 * Update the current slide number indicator
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @param int, current topic number
 * @return void
 *
 */
$.fn.updateSlideNum = function( num ) {

    counter = num;

    $( "#selectable li" ).each( function() {
        $( this ).removeClass( "ui-selected" );
    });

    $( "#selectable li:nth-child(" + Number(num) + ")" ).addClass( "ui-selected" );
    $( "#currentStatus" ).html( media + " " + num + " of " + ( ( topicCount < 10 ) ? "0" + topicCount : topicCount ) );

};

/**
 * Open the current slide image in fancybox
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.bindImgMagnify = function() {

    $( ".magnifyIcon" ).on( "click", function() {
    
        $.fancybox.open( {
        
            href: imgPath,
            title: imgCaption,
            helpers: {
                overlay: {
                    css: {
                        'background': 'rgba(250, 250, 250, 0.85)'
                    }
                }
            },
            padding: 0
            
        } );
        
    } );
    
    $('a#img').fancybox( {
    
        helpers: {
            overlay: {
                css: {
                    'background': 'rgba(250, 250, 250, 0.85)'
                }
            }
        },
        padding: 0
        
    } );

};

/**
 * Loading the instructor profile image 
 * @since 2.0.0
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

        $( "#profile .photo" ).html( "<img src=\"https://mediastreamer.doit.wisc.edu/uwli-ltc/media/storybook_plus/img/profile.png\" width=\"200\" height=\"300\" alt=\"No Profile Photo\" border=\"0\" />" );

    } ).attr( {
    
        "src": imgPath,
        "border": 0
        
    } );

};

/**
 * Adjusting the notes font size
 * @since 2.0.0
 *
 * @author Ethan S. Lin
 * @param string, minus or plus
 * @return void
 *
 */
$.fn.adjustFontSize = function( arg ) {
    
    var size = 2;
    
    if ( arg === "minus" ) {
    
        pFontSize -= size;
        pLineHeight -= size;
        h1FontSize -= size;
        h1LineHeight -= size;
        h2FontSize -= size;
        h2LineHeight -= size;
        h3h4h5h6FontSize -= size;
        h3h4h5h6LineHeight -= size;
        
    } else if ( arg === "plus" ) {
        
        pFontSize += size;
        pLineHeight += size;
        h1FontSize += size;
        h1LineHeight += size;
        h2FontSize += size;
        h2LineHeight += size;
        h3h4h5h6FontSize += size;
        h3h4h5h6LineHeight += size;
        
    }

    if (pFontSize <= 12) {

        pFontSize = 12;
        pLineHeight = 16;

    } else if (pFontSize >= 28) {

        pFontSize = 28;
        pLineHeight = 32;

    }

    if (h3h4h5h6FontSize <= 16) {

        h3h4h5h6FontSize = 16;
        h3h4h5h6LineHeight = 20;

    } else if (h3h4h5h6FontSize >= 30) {

        h3h4h5h6FontSize = 30;
        h3h4h5h6LineHeight = 34;

    }

    if (h2FontSize <= 18) {

        h2FontSize = 18;
        h2LineHeight = 22;

    } else if (h2FontSize >= 32) {

        h2FontSize = 32;
        h2LineHeight = 36;

    }

    if (h1FontSize <= 20) {

        h1FontSize = 20;
        h1LineHeight = 24;

    } else if (h1FontSize >= 34) {

        h1FontSize = 34;
        h1LineHeight = 38;

    }

    $('#note, #note p').css({
        'font-size': pFontSize,
        'line-height': pLineHeight + 'px'
    });

    $('#note h1').css({
        'font-size': h1FontSize,
        'line-height': h2LineHeight + 'px'
    });

    $('#note h2').css({
        'font-size': h2FontSize,
        'line-height': h2LineHeight + 'px'
    });

    $('#note h3, #note h4, #note h5, #note h6').css({
        'font-size': h3h4h5h6FontSize,
        'line-height': h3h4h5h6LineHeight + 'px'
    });

    $('#fontSizeIndicator').html(pFontSize);
    
};

/**
 * Request downloadable files 
 * @since 2.0.0
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
    
    if ( $( this ).fileExists( file, ext, contentType ) ) {
    
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
            exceptionMsg = "Invalid XML. XML parse failed.";
        break;
        case "timeout":
            exceptionMsg = "XML parsing timed out.";
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
    $('#errorMsg').html('<p>' + statusMsg + '<br />' + exceptionMsg + '</p>');

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




