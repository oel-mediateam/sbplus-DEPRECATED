/* global console */
/* global videojs */
/* global MediaElementPlayer */
/* global alert */

// global variable declarations
var defaultFontSize = 14;
    
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
    imgCaption;
    
var questions,
    quizDetected = false;
    
var PROFILE,
    lessonTitle,
    instructor,
    duration;
        
var audioPlayer,
    firstAudioLoad = false,
    audioPlaying = false,
    videoPlaying = false,
    sources;

$( document ).ready( function() {
	
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
        LESSON = $.trim( SETUP.find( "lesson" ).text() ),
        INSTRUCTOR = $.trim( SETUP.find( "instructor" ).text() ),
        LENGTH = $.trim( SETUP.find( "length" ).text() ),
        NOTE = $.trim( SETUP.find( "note" ).text() ),
        SLIDEFORMAT = $.trim( SETUP.find('slideImgFormat').text() );
       
    PROFILE = $.trim( XMLData.find( "profile" ).text() );
    
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
        
        topicTitle[topicCount] = $( this ).attr( 'title' );
        topicSrc[topicCount] = $( this ).attr( 'src' );
        
        if ( enabledNote ) {
        
            noteArray[topicCount] = $( this ).find( "note" ).text();
            
        }
        
        
        if ( topicSrc[topicCount] === "quiz" ) {
            
            var questionNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "question" ).text() ),
                choiceNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "choice" ).text() ),
                wrongFeedbackNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "wrongFeedback" ).text() ),
                correctFeedbackNode = $.trim( XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('correctFeedback').text() ),
                quizTypeAttr = XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).attr( "type" ),
                answerNode = $.trim( XMLData.find( "topic:eq(" + topicCount + ")" ).find( "quiz" ).find( "answer" ).text() );
            
            var quiz = {};
            
            quizDetected = true;
            
            quiz.id = topicCount;
            quiz.type = quizTypeAttr;
            quiz.question = questionNode;

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
 *
 * @author Ethan S. Lin
 * @return void
 *
 */
$.fn.setupPlayer = function() {
    
    var directory = $.fn.getDirectory();
    var selfAssessmentIcon;
    
    $( document ).attr( "title", lessonTitle );
    
    // initialy hide error message container
    $( "#errorMsg" ).hide();
    
    // loop to check whether all topics are video or mixed
    $.each( topicSrc, function( i ) {
	
		var tSrc = topicSrc[i].substring( 0, topicSrc[i].indexOf( ":" ) + 1 );
		
		if ( tSrc === "video:" || tSrc === "youtube:" ) {
		
			media = "Video";
			
		} else {

			media = "Slide";
			return false;
			
		}
		
	} );
	
    if ( enabledNote === false && quizDetected === false ) {
    
        $( "#storybook_plus_wrapper" ).addClass( "noteDisabled" );
        
    } else if ( enabledNote === false && quizDetected === true ) {
    
        $( "#storybook_plus_wrapper" ).addClass( "withQuiz" );
        
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
    $( "#lessonTitle" ).html( lessonTitle );
    $( "#instructorName" ).html( "<a class=\"instructorName\" href=\"#profile\">" + instructor + "</a>" );
    
    // setup profile panel
    $( "#profile .bio" ).html( "<p>" + instructor + "</p>" + PROFILE );
    
    $( "#player" ).append( "<div id=\"progressing\"></div>" );
	
	// enable fancy box for profile panel
    $( "#info, a.instructorName" ).fancybox( {
    
        helpers: {
            overlay: {
                css: {
                    'background': 'rgba(250, 250, 250, 0.85)'
                }
            }
        },
        padding: 0
        
    } );
	
	// setup toc selectable items
	$( "#selectable li:first" ).addClass( "ui-selected" );
    $( "#selectable" ).selectable( {
    
        stop: function() {

            $( ".ui-selected", this ).each( function() {
                
                tocIndex = $( "#selectable li" ).index( this );
                
            } );
            
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
    
    // note is enabled
    if ( enabledNote ) {

        // display current font size
        $('#fontSizeIndicator').html( defaultFontSize );

        // binding increasing and decreasing font size buttons
        $('#fontMinusBtn').on('click', function() {

            $.fn.adjustFontSize( "minus" );
            return false;

        });

        // font plus button
        $('#fontPlusBtn').on('click', function() {

            $.fn.adjustFontSize( "plus" );
            return false;

        });

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
 *
 * @author Ethan S. Lin
 *
 * @param string and int, slide type and slide number
 * @return void
 *
 */
$.fn.loadSlide = function( slideSource, sNum ) {

    var img;
    var srcName = slideSource.substring( slideSource.indexOf( ":" ) + 1 ) ;
    
    if ( slideSource !== "quiz" ) {
    
        slideSource = slideSource.substring( 0, slideSource.indexOf( ":" ) + 1 );
        
    }
    
    $( "#progressing" ).fadeIn();
    
    if ( $( "#slideNote" ).hasClass( "quizSlide" ) ) {
        
        $( "#slideNote" ).removeClass( "quizSlide" );
        
    }
    
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
    
    switch ( slideSource ) {
        
        case "image:":
            
            img = new Image();

            imgPath = "assets/slides/" + srcName + "." + slideImgFormat;
            imgCaption = $( "#selectable li .title" ).get( sNum ).innerHTML;
    
            $( img ).load( function() {
                
                $( this ).hide();
                $( "#slide" ).html( "<a id=\"img\" title=\"" + imgCaption + "\" href=\"" + imgPath + "\">" );
                $( "#slide #img" ).html( img );
                $( "#slide" ).append( "</a><div class=\"magnifyIcon\"></div>" );
                $( this ).fadeIn();
                $( this ).bindImgMagnify();
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
                $( "#slide" ).html( "<a id=\"img\" title=\"" + imgCaption + "\"href=\"" + imgPath + "\">" );
                $( "#slide #img" ).html( img );
                $( "#slide" ).append( "</a><div class=\"magnifyIcon\"></div>" );
                $( this ).fadeIn();
                $( this ).bindImgMagnify();
                $( "#progressing" ).fadeOut();
    
                if ( !audioPlaying ) {
    
                    if ( enabledNote ) {
    					
    					if ( $.fn.fileExists( "assets/audio/" + srcName, "mp3", "audio/mpeg" ) ) {
                            
                            $( "#ap").show();
                            
                            if (firstAudioLoad !== true) {
    					    
                    		    $.fn.loadAudioPlayer( "#apc", srcName );
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
    
                        if ( $.fn.fileExists( "assets/audio/" + srcName, "mp3", "audio/mpeg" ) ) {
                            
                            $( "#apm" ).show();
                            
                            if (firstAudioLoad !== true) {
    					    
                    		    $.fn.loadAudioPlayer( "#apcm", srcName );
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
    
            } ).attr( {
            
                'src': imgPath,
                'border': 0
                
            } );
        
        break;
        
        case "video:":
        
            var time = $.now(),
                playerID = "vpc" + time;
    
            $( "#vp" ).append( "<video id=\"" + playerID + "\" class=\"video-js vjs-default-skin\" controls autoplay width=\"640\" height=\"360\">" + ( ( $.fn.fileExists( "assets/video/" + srcName, "vtt", "text/vtt" ) ) ? "<track kind=\"subtitles\" src=\"assets/video/" + srcName + ".vtt\" srclang=\"en\" label=\"English\" default>" : "" ) + "</video>" ).promise().done( function() {
                
                $( "#progressing" ).fadeOut();
                
            } );
    
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
        
            $( "#slide" ).html( "<iframe width=\"640\" height=\"360\" src=\"https://www.youtube.com/embed/" + srcName + "?modestbranding=1&theme=light&color=white&showinfo=0&autoplay=1&controls=2&html5=1&autohide=1&rel=0\" frameborder=\"0\" allowfullscreen></iframe>" ).promise().done( function() {
                
                $( "#progressing" ).fadeOut();
                
            } );
        
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
    
    var index = 0, found = false, error = false;
    var answerLength;
    
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

        $( "#quiz" ).append( "<div class=\"question\">" + questions[index].question + "</div>" );
        
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
                
                for ( var i = 0; i < questions[index].choice.length; i++ ) {
                    
                    $( ".answerArea" ).append( "<label for=\"" + i + "\"><input id=\"" + i + "\" type=\"" + type  + "\" name=\"" + name + "" + "\" value=\"" + questions[index].choice[i] + "\" /> " + questions[index].choice[i] + "</label>" );
                    
                }
    
                $( "#quiz" ).append( "</div>" );
            
            break;
            
            case "sa":
                
                $( "#quiz" ).append( "<div class=\"answerArea\"><textarea id=\"saAns\"></textArea></div>" );
                
            break;
            
            default:
            
                error = true;
                $.fn.displayErrorMsg( "unknow question type!", "Please double check the topic XML file." );
            
            break;
            
        }
        
        if ( !error ) {
        
            $( "#quiz" ).append( "<div class=\"submitArea\"><a id=\"check\" rel=\"" + index + "\" href=\"javascript:void(0)\">SUBMIT</a></div>" );
            
        }
        
    } else {
    
        $.fn.showFeedback( index );
        
    }
    
    if ( !error ) {
    
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
                
                    if (stuAnswer === undefined) {
                    
                        stuAnswer = "";
                        
                    }
                
                break;
                
                case "fib":
                    
                    stuAnswer = $.trim( $( "#saAns" ).val() );
                    
                break;
                
                case "mc":
                    
                    if ( answerLength > 1) {
                        
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
            
                alert( "Please answer the question before submitting." );
                
            }
    
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

    $( "#slide" ).html( "<div id=\"quiz\"><div class=\"header\"><span class=\"icon-assessement\"></span> Self-Assessment Feedback</div>" );

    if ( questions[index].type !== "sa" ) {

        if ( questions[index].correct ) {
        
            $( "#quiz" ).append( "<p class=\"quizCorrect\"><span class=\"icon-checkmark\"></span> CORRECT</p>" );
            
        } else {
        
            $( "#quiz" ).append( "<p class=\"quizIncorrect\"><span class=\"icon-notification\"></span> INCORRECT</p>" );
            
        }

    }

    $( "#quiz" ).append( "<div class=\"question\">" + questions[index].question + "</div><div class=\"result\"><p><strong>Your answer</strong>: " + $.fn.parseArray( questions[index].stuAnswer ) + "</p>" );

    $('.result').append('<p><strong>Correct answer</strong>: ' + $.fn.parseArray( questions[index].answer ) + '</p></div>');

    if ( questions[index].type !== "sa" ) {

        if ( questions[index].correct ) {
            
            if ( String( questions[index].correctFeedback ) !== "" ) {
                
                $('.result').append('<p><strong>Feedback:</strong> ' + questions[index].correctFeedback + '</p>');
                
            }
            
        } else {
        
            if (questions[index].type === "mc") {

                var feedback = questions[index].wrongFeedback[questions[index].incorrectIndex];
                
                if (typeof feedback === undefined) {
                    feedback = "";
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
    	
	} else {
	
    	$( "#note" ).hide();
    	
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
 * @since 2.1.0
 *
 * @author Ethan S. Lin
 * @param string, minus or plus
 * @return void
 *
 */
$.fn.adjustFontSize = function( arg ) {
    
    var size = 2;
    
    if ( arg === "minus" ) {
    
        defaultFontSize -= size;
        
    } else if ( arg === "plus" ) {
        
        defaultFontSize += size;
        
    }
    
    if ( defaultFontSize <= 12 ) {
    
        defaultFontSize = 12;
        
    } else if ( defaultFontSize >= 20) {
        
        defaultFontSize = 20;
        
    }
    
    $( "#note" ).removeClass();

    if ( defaultFontSize === 12 ) {
        
        $( "#note" ).addClass( "size12" );

    } else if ( defaultFontSize === 16 ) {

        $( "#note" ).addClass( "size16" );

    } else if ( defaultFontSize === 18 ) {
    
        $( "#note" ).addClass( "size18" );
        
    } else if ( defaultFontSize === 20 ) {
        
        $( "#note" ).addClass( "size20" );
        
    }

    $( '#fontSizeIndicator' ).html( defaultFontSize );
    
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
 * @param array and int, the array to parse and 1 for "and" and 0 for "or"
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