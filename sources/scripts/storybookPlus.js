/* global console */
/* global videojs */
/* global MediaElementPlayer */
/* global alert */

$(document).load(function () {
    $('noscript').hide();
});

$(document).ready(function () {

	var media = "Slide";

	// get query strings
    function getParameterByName(name) {
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);

        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");

        if (results === null) {
            return "";
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    } // end getParameterByName
	

    var ua = navigator.userAgent,
        checker = {
            iphone: ua.match(/(iPhone|iPod|iPad)/),
            blackberry: ua.match(/BlackBerry/),
            android: ua.match(/Android/)
        };

    var mobile = (getParameterByName("m") === "0") ? false : true;

    if ((checker.iphone || checker.ipod || checker.ipad || checker.blackberry || checker.android) && mobile) {

        var location = window.location.href,
            locTemp,
            locIndex = location.indexOf(".");

        locTemp = location.substr(locIndex);
        location = "http://webstreamer" + locTemp + "?m=0";

        $("#player").hide();

        $('body').html('<div style="text-align:center; width:450px; height:315px;"><a href="' + location + '" target="_blank"><img src="https://mediastreamer.doit.wisc.edu/uwli-ltc/media/storybook_plus/img/view_on_full_site.png" width="450px" height="315px" alt="Launch Presentation in New Window" border="0" /></a></div>');

    } else {

        // global variable declarations
        var pFontSize = 14,
            pLineHeight = 18,
            h1FontSize = 22,
            h1LineHeight = 26,
            h2FontSize = 20,
            h2LineHeight = 24,
            h3h4h5h6FontSize = 18,
            h3h4h5h6LineHeight = 22,
            firstList = true,
            firstAudioLoad = false,
            topicCount = 0,
            counter = 1,
            previousIndex = 0,
            tocIndex = 0,
            audioPlaying = false,
            videoPlaying = false,
            XMLData,
            topicSrc,
            slideImgFormat,
            imgPath,
            audioPlayer,
            enabledNote = false,
            imgCaption, quiz, quizArray, found = false,
            qNum = 0;

        // AJAX setup
        $.ajaxSetup({
            url: 'assets/topic.xml',
            type: 'GET',
            dataType: 'xml',
            accepts: 'xml',
            content: 'xml',
            contentType: 'xml; charset="utf-8"',
            cache: false
        });

        // Encoding XML data
        $.ajax({
            encoding: 'UTF-8',
            beforeSend: function (xhr) {
                xhr.overrideMimeType("xml; charset=utf-8");
                xhr.setRequestHeader("Accept", "text/xml");
            },
            success: function (xml) {

                setupXML(xml);

            },
            error: function (xhr, exception) {
                displayError(xhr.status, exception);
            }
        });

    }

    // XML Setup function

    function setupXML(xml) {

        var SETUP = $(xml).find('setup');
        var TOPIC = $(xml).find('topic');
        var profile = $(xml).find('profile').text();
        var lessonTitle = (SETUP.find('lesson').text().length <= 0) ? 'Lesson name is not specified' : SETUP.find('lesson').text();
        var instructor = (SETUP.find('instructor').text().length <= 0) ? 'Instructor is not specified' : '<a class="instructorP" href="#profile">' + SETUP.find('instructor').text() + '</a>';
        var length = (SETUP.find('length').text().length <= 0) ? '' : SETUP.find('length').text();

        enabledNote = (SETUP.find('note').text().length <= 0) ? false : SETUP.find('note').text();

        // set flag for note availabity
        if (enabledNote === 'yes' || enabledNote === 'y') {
            enabledNote = true;
        } else {
            enabledNote = false;
        }

        if (!enabledNote) {
            $("#note").hide();
            $("#fontMinusBtn").hide();
            $("#fontPlusBtn").hide();
            $("#fontSizeIndicator").hide();
            $("#toc").css("height","399px");
        }

        slideImgFormat = (SETUP.find('slideImgFormat').text().length <= 0) ? 'png' : SETUP.find('slideImgFormat').text();
        XMLData = $(xml);

        $('#lessonTitle').html(lessonTitle);
        $('#instructorName').html(instructor);
        $('#profile .bio').html('<p>' + SETUP.find('instructor').text() + '</p>' + profile);

        topicSrc = [];
        quizArray = [];

        // loop through each topic node to get lesson topics
        // display each topic to web page as well
        TOPIC.each(function () {

            var topicTitle = $(this).attr('title');

            topicSrc[topicCount] = $(this).attr('src');

            if (firstList === true) {

                $('#selectable').html('<li class="ui-widget-content" title="' + topicTitle + '">' + '<div style="width:10%;padding:0px 1%;text-align:right;float:left;">' + (((topicCount + 1) < 10) ? '0' + (topicCount + 1) : (topicCount + 1)) + '.</div><div class="title" style="width:86%;padding:0px 1%;float:left;">' + topicTitle + '</div></li>');

                firstList = false;

            } else {

                $('#selectable').append('<li class="ui-widget-content" title="' + topicTitle + '">' + '<div style="width:10%;padding:0px 1%;text-align:right;float:left;">' + (((topicCount + 1) < 10) ? '0' + (topicCount + 1) : (topicCount + 1)) + '.</div><div class="title" style="width:86%;padding:0px 1%;float:left;">' + topicTitle + '</div></li>');

            }

            if (topicSrc[topicCount] === "quiz") {

                quiz = {};
                quiz.id = topicCount;
                quiz.type = XMLData.find('topic:eq(' + topicCount + ')').find('quiz').attr('type');
                quiz.question = XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('question').text();

                if (XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('choice').text() !== "") {
                    quiz.choice = parseSelects(XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('choice').text());
                    quiz.wrongFeedback = parseSelects(XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('wrongFeedback').text());
                } else {
                    quiz.wrongFeedback = XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('wrongFeedback').text();
                }

                quiz.answer = parseSelects(XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('answer').text());
                quiz.stuAnswer = "";
                quiz.correct = false;
                quiz.correctFeedback = XMLData.find('topic:eq(' + topicCount + ')').find('quiz').find('correctFeedback').text();
                quiz.taken = false;
                quizArray.push(quiz);

            }

            topicCount++;

        });

        // set the document title to the lesson title
        $(document).attr('title', lessonTitle);
        
        // add the index.html to the URL
		/*
try {
			if (mobile) {
				var path = window.location.href;
				path = path.replace("index.html","");
				window.history.pushState("", "", path + "index.html");
			}
		} catch (e) {
			console.log(e + ' ---> No HTML history API support!');
		}
*/

        // set the splash screen
        $("#splash_screen").append('<p>' + lessonTitle + '</p><p>' + ((SETUP.find('instructor').text().length <= 0) ? 'Instructor is not specified' : SETUP.find('instructor').text()) + '</p>' + ((length !== 0) ? '<p>' + length + '</p>' : '') + '<p><a id="playBtn" href="#">&#9658</button></a>');
        
        $("#splash_screen").css("background-image","url(assets/splash.jpg)");

        if (!enabledNote) {
            $("#splash_screen").css({
                "height": "230px",
                "padding-top": "100px",
                "padding-bottom": "100px",
                "padding-right": "200px",
                "padding-left": "200px"
            });
        }

        $('#splash_screen, #playBtn').on("click", function () {
            initializePlayer(lessonTitle);
            $("#splash_screen").hide();
            return false;
        });

        // set up download bar
        lessonTitle = lessonTitle.toLowerCase().replace("-", "_").replace(" ","_");

        // download files
        fileExist(getSource(), "mp3");
        fileExist(getSource(), "pdf");

    } // end setupXML

    function parseSelects(ans) {
        var index = 0;
        var answerArray = [];
        var answer = ans,
            answerTemp, position;

        answer += "|";
        position = answer.indexOf('|');

        while (answer.indexOf('|') !== -1) {
            answerTemp = answer.substring(0, position);
            answer = answer.substring(position + 1);
            position = answer.indexOf('|');
            answerArray[index] = answerTemp;
            index++;
        }

        return answerArray;
    } // end parseSelect


    // initialized player function

    function initializePlayer() {

        $("#player").show();
		
		jQuery.each(topicSrc,function(i) {
			var tSrc = topicSrc[i].substring(0, topicSrc[i].indexOf(":") +1);
			if (tSrc === "video:" || tSrc === "youtube:") {
				media = "Video";
			} else {
				media = "Slide";
				return false;
			}
		});
		
        loadSlide(topicSrc[0], counter);
        $('#selectable li:first').addClass('ui-selected');

        // hide error message div tag
        $('#errorMsg').hide();

        // enable table of content selection
        $('#selectable').selectable({

            stop: function () {

                $(".ui-selected", this).each(function () {

                    tocIndex = $("#selectable li").index(this) + 1;

                });

                if (tocIndex !== previousIndex) {

                    loadSlide(topicSrc[tocIndex - 1], tocIndex);
                    previousIndex = tocIndex;

                }
            }

        });

        // load and set the instructor picture
        loadProfilePhoto();

        // enable fancy box for profile panel
        $("a#info, a.instructorP").fancybox({
            helpers: {
                overlay: {
                    css: {
                        'background': 'rgba(250, 250, 250, 0.85)'
                    }
                }
            },
            padding: 0
        });

        // note is enabled
        if (enabledNote) {

            // display current font size
            $('#fontSizeIndicator').html(pFontSize);

            // binding increasing and decreasing font size buttons
            $('#fontMinusBtn').on('click', function () {

                pFontSize -= 2;
                pLineHeight -= 2;

                h1FontSize -= 2;
                h1LineHeight -= 2;

                h2FontSize -= 2;
                h2LineHeight -= 2;

                h3h4h5h6FontSize -= 2;
                h3h4h5h6LineHeight -= 2;

                if (pFontSize <= 12) {

                    pFontSize = 12;
                    pLineHeight = 16;

                }

                if (h3h4h5h6FontSize <= 16) {

                    h3h4h5h6FontSize = 16;
                    h3h4h5h6LineHeight = 20;

                }

                if (h2FontSize <= 18) {

                    h2FontSize = 18;
                    h2LineHeight = 22;

                }

                if (h1FontSize <= 20) {

                    h1FontSize = 20;
                    h1LineHeight = 24;

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

            });

            // font plus button
            $('#fontPlusBtn').on('click', function () {

                pFontSize += 2;
                pLineHeight += 2;

                h1FontSize += 2;
                h1LineHeight += 2;

                h2FontSize += 2;
                h2LineHeight += 2;

                h3h4h5h6FontSize += 2;
                h3h4h5h6LineHeight += 2;

                if (pFontSize >= 28) {

                    pFontSize = 28;
                    pLineHeight = 32;

                }

                if (h3h4h5h6FontSize >= 30) {

                    h3h4h5h6FontSize = 30;
                    h3h4h5h6LineHeight = 34;

                }

                if (h2FontSize >= 32) {

                    h2FontSize = 32;
                    h2LineHeight = 36;

                }

                if (h1FontSize >= 34) {

                    h1FontSize = 34;
                    h1LineHeight = 38;

                }

                $('#note, #note p').css({
                    'font-size': pFontSize,
                    'line-height': pLineHeight + 'px'
                });

                $('#note h1').css({
                    'font-size': h1FontSize,
                    'line-height': h1LineHeight + 'px'
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

            });

        } // end if

        // binding left and right click event
        $('#leftBtn').on('click', function () {

            counter--;

            if (counter <= 0) {
                counter = topicCount;
            }

            loadSlide(topicSrc[counter - 1], counter);

        });

        $('#rightBtn').on('click', function () {

            counter++;

            if (counter > topicCount) {
                counter = 1;
            }

            loadSlide(topicSrc[counter - 1], counter);

        });

    } // end init



    // load current selected slide

    function loadSlide(sn, sNum) {

        var currentNum, noteNum, img;

        sNum = (sNum < 10) ? '0' + sNum : sNum;
        currentNum = Number(sNum) - 1;
        noteNum = Number(sNum) - 1;

        $("#slide").html("<div id=\"progressing\"></div>");
        $('#progressing').fadeIn();

        // if video is playing
        if (videoPlaying) {
            $("#vp").html("");
            $('#vp').hide();
            videoPlaying = false;
        }
        
        // if audio is playing
        if (audioPlaying) {

            audioPlayer.setCurrentTime(0);
            audioPlayer.pause();
            audioPlaying = false;

            if (enabledNote) {
                $('#ap').hide();
                $('#note').height($('#note').height() + 30);
            } else {
                $('#apm').hide();
                $("#currentStatus").css("width", "76.85%");
            }

        }

        // if is an image
        if (sn.substring(0, sn.indexOf(":") + 1) === "image:") {

            img = new Image();

            imgPath = 'assets/slides/' + sn.substring(sn.indexOf(":") + 1) + '.' + slideImgFormat;
            imgCaption = $('#selectable li .title').get(currentNum).innerHTML;

            $(img).load(function () {

                $(this).hide();
                $('#slide').append('<a id="img" title="' + imgCaption + '"href="' + imgPath + '">');
                $('#slide #img').html(img);
                $('#slide').append('</a><div id="magnifyIcon"></div>');

                $(this).fadeIn();

                $('a#img').fancybox({
                    helpers: {
                        overlay: {
                            css: {
                                'background': 'rgba(250, 250, 250, 0.85)'
                            }
                        }
                    },
                    padding: 0
                });

                bindImgMagnify(true);

            }).error(function (error) {

                $('#slide').html('<p><strong>Error</strong>: image not found. Image path: ' + imgPath + '</p><p>Total number of slides: ' + topicCount + '</p><p>' + error + '</p>');

            }).attr({
                'src': imgPath,
                'border': 0
            });


            // youtube
        } else if (sn.substring(0, sn.indexOf(":") + 1) === "youtube:") {

            bindImgMagnify(false);

            $('#slide').append('<iframe width="640" height="360" src="https://www.youtube.com/embed/' + sn.substring(sn.indexOf(":") + 1) + '?autoplay=1&rel=0" frameborder="0" allowfullscreen></iframe>');


            // video
        } else if (sn.substring(0, sn.indexOf(":") + 1) === "video:") {

            bindImgMagnify(false);

            var time = $.now();

            $('#vp').append("<video id=\"vpc" + time + "\" class=\"video-js vjs-default-skin\" controls autoplay preload=\"none\" width=\"640\" height=\"360\" data-setup='{\"controls\":true}'>" + ((sbttlExist(sn.substring(sn.indexOf(":") + 1))) ? "<track kind=\"subtitles\" src=\"assets/video/" + sn.substring(sn.indexOf(":") + 1) + ".vtt\" srclang=\"en\" label=\"English\" default>" : "" ) + "</video>");

            if (!videoPlaying) {
                $("#vp").show();

                videojs("vpc" + time, {}, function () {
                    this.progressTips();
                    this.src([
						{type: "video/mp4", src:"assets/video/" + sn.substring(sn.indexOf(":") + 1) + ".mp4"},
						{type: "video/webm", src:"assets/video/" + sn.substring(sn.indexOf(":") + 1) + ".webm"}
					]);
                });
                
                videojs.options.flash.swf = "sources/videoplayer/video-js.swf";

                videoPlaying = true;
            }

            // swf or interactive objects
        } else if (sn.substring(0, sn.indexOf(":") + 1) === "swf:") {

            bindImgMagnify(false);

            $('#slide').append('<object width="640" height="360" type="application/x-shockwave-flash" data="assets/swf/' + sn.substring(sn.indexOf(":") + 1) + '.swf"><param name="movie" value="assets/swf/' + sn + '.swf" /><p>Your web browser does not support Adobe Flash.</p></object>');

            // image slide with audio
        } else if (sn.substring(0, sn.indexOf(":") + 1) === "image-audio:") {

            img = new Image();

            imgPath = 'assets/slides/' + sn.substring(sn.indexOf(":") + 1) + '.' + slideImgFormat;
            imgCaption = $('#selectable li .title').get(currentNum).innerHTML;

            $(img).load(function () {

                $(this).hide();

                $('#slide').append('<a id="img" title="' + imgCaption + '"href="' + imgPath + '">');
                $('#slide #img').html(img);
                $('#slide').append('</a><div id="magnifyIcon"></div>');

                $(this).fadeIn();

                $('a#img').fancybox({
                    helpers: {
                        overlay: {
                            css: {
                                'background': 'rgba(250, 250, 250, 0.85)'
                            }
                        }
                    },
                    padding: 0
                });

                bindImgMagnify(true);

                if (!audioPlaying) {
                
					var sources;

                    if (enabledNote) {

                        $('#ap').show();

						if (firstAudioLoad !== true) {
							audioPlayer = new MediaElementPlayer('#apc', {
								audioWidth: 640,
								audioHeight: 30,
								startVolume: 0.8,
								loop: false,
								enableAutosize: true,
								iPadUseNativeControls: false,
								iPhoneUseNativeControls: false,
								AndroidUseNativeControls: false,
								pauseOtherPlayers: true,
								type: 'audio/mpeg',
								success: function(me) {
									sources = [{src: "assets/audio/" + sn.substring(sn.indexOf(":") + 1) + ".mp3", type: "audio/mpeg"}];
									me.setSrc(sources);
									me.load();
								}
							});
							
							firstAudioLoad = true;
						} else {
							sources = [{src: "assets/audio/" + sn.substring(sn.indexOf(":") + 1) + ".mp3", type: "audio/mpeg"}];
							audioPlayer.setSrc(sources);
						}
                        
                        $('#note').height($('#note').height() - 30);

                    } else {

                        $('#apm').show();
                        
						if (firstAudioLoad !== true) {
						audioPlayer = new MediaElementPlayer('#apcm', {
							audioWidth: 300,
							audioHeight: 30,
							startVolume: 0.8,
							loop: false,
							enableAutosize: true,
							iPadUseNativeControls: false,
							iPhoneUseNativeControls: false,
							AndroidUseNativeControls: false,
							pauseOtherPlayers: true,
							type: 'audio/mpeg',
							success: function(me) {
								sources = [{src: "assets/audio/" + sn.substring(sn.indexOf(":") + 1) + ".mp3", type: "audio/mpeg"}];
								me.setSrc(sources);
								me.load();
							}
						});
						
							firstAudioLoad = true;
						} else {
							sources = [{src: "assets/audio/" + sn.substring(sn.indexOf(":") + 1) + ".mp3", type: "audio/mpeg"}];
							audioPlayer.setSrc(sources);
						}
							
                        $("#currentStatus").css("width", "30%");

                    }

                    audioPlaying = true;

                }

            }).error(function (error) {

                $('#slide').html('<p><strong>Error</strong>: image not found. Image path: ' + imgPath + '</p><p>' + error + '</p>');

            }).attr({
                'src': imgPath,
                'border': 0
            });

        } else if (sn === "quiz") {

            try {
                setupQuiz(currentNum);
            } catch (e) {
                // for debug console purposes
                console.append('<li>' + e + '</li>');
            }

        } else {

            $('#slide').html("<p>ERROR!</p>");

        }

        // load current slide note and update the slide number
        loadNote(noteNum);
        updateSlideNum(sNum);

        $('#progressing').hide();

    } // end loadSlide


    // load current slide note

    function loadNote(num) {

        var note = XMLData.find('topic:eq(' + num + ')').find('note').text();
		
        $('#note').html(note);
			
			if ($("#note").find("a").length) {
				$("#note a").each(function() {
					$(this).attr("target","_blank");
			});
			
        }

    } // end loadNote


    // loading the photo in the profile panel

    function loadProfilePhoto() {

        var img = new Image(),
            imgPath = 'assets/pic.jpg';

        $(img).load(function () {

            $('#profile .photo').html('<img src="' + imgPath + '" alt="Instructor Photo" border="0" />');

        }).error(function () {

            $('#profile .photo').html('<img src="assets/img/profile.png" width="200" height="300" alt="No Profile Photo" border="0" />');

        }).attr({
            'src': imgPath,
            'border': 0
        });

    } // end loadProfilePhoto


    // updating table of content selection

    function updateSlideNum(num) {

        counter = num;

        $('#selectable li').each(function () {
            $(this).removeClass('ui-selected');
        });

        $('#selectable li:nth-child(' + Number(num) + ')').addClass('ui-selected');
        $("#currentStatus").html(media + ' ' + num + ' of ' + ((topicCount < 10) ? "0" + topicCount : topicCount));

    } // end updateSlideNum


    // function to bind magnify icon

    function bindImgMagnify(t) {
        if (t) {
            $('a#img, #magnifyIcon').on('mouseenter', function () {
                $("#magnifyIcon").show();
            });
            $('a#img, #magnifyIcon').on('mouseleave', function () {
                $("#magnifyIcon").hide();
            });
            $("#magnifyIcon").on('click', function () {
                $.fancybox.open({
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
                });
            });
        }

    } // end bindImgMagnify


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

            $('#quiz').append('<div class="submitArea"><button id="check" rel="' + qNum + '">SUBMIT</button></div>');

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
                $('#quiz').append('<p class="quizCorrect">Correct!</p>');
            } else {
                $('#quiz').append('<p class="quizIncorrect">Incorrect!</p>');
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


    // error handling function

    function displayError(status, exception) {

        var statusMsg, exceptionMsg;

        if (status === 0) {
            statusMsg = '<strong>Error 0</strong> - Not connect. Please verify network.';
        } else if (status === 404) {
            statusMsg = '<strong>Error 404</strong> - Requested page not found.';
        } else if (status === 406) {
            statusMsg = '<strong>Error 406</strong> - Not acceptable error.';
        } else if (status === 500) {
            statusMsg = '<strong>Error 500</strong> - Internal Server Error.';
        } else {
            statusMsg = 'Unknow error';
        }

        if (exception === 'parsererror') {
            exceptionMsg = 'Requested XML parse failed.';
        } else if (exception === 'timeout') {
            exceptionMsg = 'Time out error.';
        } else if (exception === 'abort') {
            exceptionMsg = 'Ajax request aborted.';
        } else if (exception === "error") {
            exceptionMsg = 'HTTP / URL Error (most likely a 404 or 406).';
        } else {
            exceptionMsg = ('Uncaught Error.\n' + status.responseText);
        }

        $('#player').hide();
        $('#errorMsg').html('<p>' + statusMsg + '<br />' + exceptionMsg + '</p>');

    } // end displayError

	// checking for download file existence
    function fileExist(file, ext) {
        
        var content_type;
        
        if (ext === "pdf") {
			content_type = "application/pdf";
        } else {
			content_type = "audio/mpeg";
        }
        
        $.ajax({
            url: file + "." + ext,
            type: 'HEAD',
            dataType: 'text',
            contentType: content_type,
            async: false,
            beforeSend: function (xhr) {
                xhr.overrideMimeType(content_type);
                xhr.setRequestHeader("Accept", content_type);
            },
            success: function () {

                var f = file, downloadBar = $("#download_bar ul");
                var protocol = window.location.protocol;
				
				if (protocol !== "http:") {
					var url = window.location.href;
					url = url.substr(0,url.lastIndexOf("/")+1).replace("https","http");
					f = url + file;
				}
				
				if (ext === "pdf") {
					downloadBar.append("<li><a href=\"" + f + "." + ext + "\" target=\"_blank\">Transcript</a></li>");
				} else if (ext === "mp3") {
					downloadBar.append("<li><a href=\"" + f + "." + ext + "\" target=\"_blank\">Audio</a></li>");
				}

            },
            error: function () {

                /*
if (ext === "pdf") {
                    $("#download_bar ul").before("<p>Transcript pending...</p>");
                }
*/

            }
        });
    }
    
    // checking for subtitle existence
    function sbttlExist(file) {
		var yes = false;
		$.ajax({
			url: "assets/video/" + file + ".vtt",
			type: 'HEAD',
			dataType: 'text',
			contentType: "text/vtt",
			async: false,
			beforeSend: function (xhr) {
				xhr.overrideMimeType("text/vtt");
				xhr.setRequestHeader("Accept", "text/vtt");
			},
			success: function () {
				yes = true;
			},
			error: function () {
				yes = false;
			}
		});
        return (yes);
    }
    
    function getSource() {
		var urlToParse = window.location.href, src;
		
		/* console.log("URL to parse: " + urlToParse); */
		src = urlToParse.split("?");
		src = src[0].split("/");
		src = src[src.length-2];
		return src;
	}

});