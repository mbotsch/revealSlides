"use strict";

var RevealQuiz = (function(){

    // state of ballot server: "not_init", "open", "closed"
    var serverState;

    // state of ballot
    var ballotState;

    // timer for updating #votes
    var timerVotes, timerStatus;

    // get config
	var config = Reveal.getConfig().quiz || {};

    // get quiz server
    var server = config.server || "http://graphics.uni-bielefeld.de:8080";


    // get path of script -> used for loading audio files
	var path = scriptPath();
	function scriptPath() {
		// obtain plugin path from the script element
        // !!! script has to be named "quiz.js" !!!
		var path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -7);
		} else {
			var sel = document.querySelector('script[src$="/quiz.js"]')
			if (sel) {
				path = sel.src.slice(0, -7);
			}
		}
		return path;
	}


    // DIV for chart
    var chart_div = document.createElement( 'div' );
    chart_div.classList.add( 'overlay' );
	chart_div.classList.add( 'visible' );
	chart_div.setAttribute( 'data-prevent-swipe', '' );
    chart_div.style.visibility      = 'hidden';
	chart_div.style.zIndex          = "32";
	chart_div.style.position        = "absolute";
    chart_div.style.left            = "auto";
    chart_div.style.top             = "auto";
    chart_div.style.right           = "10px";
    chart_div.style.bottom          = "10px";
    chart_div.style.width           = "420px";
    chart_div.style.height          = "320px";
    chart_div.style.margin          = "auto";
    chart_div.style.padding         = "5px";
    chart_div.style.textAlign       = "center";
    chart_div.style.border          = "3px solid #2a9ddf";
    chart_div.style.borderRadius    = "10px";
    chart_div.style.boxShadow       = "3px 5px 5px grey";
	chart_div.style.backgroundColor = 'rgba(255,255,255,1.0)';
    document.querySelector(".reveal").appendChild( chart_div );


    // generate label for #votes
    var votes_div = document.createElement( 'div' );
    votes_div.classList.add( 'overlay' );
	votes_div.classList.add( 'visible' );
	votes_div.setAttribute( 'data-prevent-swipe', '' );
    votes_div.style.visibility      = 'hidden';
	votes_div.style.zIndex          = "31";
	votes_div.style.position        = "absolute";
    votes_div.style.left            = "auto";
    votes_div.style.top             = "auto";
    votes_div.style.right           = "10px";
    votes_div.style.bottom          = "10px";
    votes_div.style.width           = "auto";
    votes_div.style.height          = "auto";
    votes_div.style.margin          = "auto";
    votes_div.style.padding         = "5px";
    votes_div.style.color           = "black";
    votes_div.style.fontSize        = "20px";
    votes_div.style.textAlign       = "center";
    votes_div.style.border          = "3px solid #2a9ddf";
    votes_div.style.borderRadius    = "10px";
    votes_div.style.boxShadow       = "3px 5px 5px grey";
	votes_div.style.backgroundColor = 'rgba(255,255,255,1.0)';
    votes_div.style.cursor          = "help";
    document.querySelector(".reveal").appendChild( votes_div );



    // generate QR code (user has to place DIV with id="quiz-qr" in HTML)
    if (typeof(QRCode) != 'undefined')
    {
        var e = document.getElementById("quiz-qr");
        if (e)
        {
            var size = parseInt(e.style.width, 10) || 300;
            var qrcode = new QRCode("quiz-qr", {
                text:         server,
                width:        size,
                height:       size,
                colorDark:    "#000000",
                colorLight:   "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
	        qrcode.makeCode(server);
        }
    }


    // type URL in respective DIV
    var e = document.getElementById("quiz-url");
    if (e) e.innerHTML = server;


    // load WWM jingles
    var jingleQuestion = new Audio(path+'/wwm-question.mp3');
    var jingleAnswer   = new Audio(path+'/wwm-answer.mp3');


    // is this window a presenter preview? see reveal.js:isSpeakerNotes()
    // if it is, then shut up and do not play audio jingles
    var shutUp = !!Reveal.isSpeakerNotes();


    // load google charts & create chart object
    if (typeof(google) != 'undefined')
    {
        google.charts.load("current", {packages:['corechart']});
    }


    // what to do on slide change
    function slideChanged()
    {
        // if not presenter displayw slide preview
        if (!shutUp)
        {
            // stop sounds
            jingleQuestion.pause();
            jingleAnswer.pause();

            // hide stuff
            hideVotes();
            hideChart();

            // remove timers
            clearInterval(timerVotes);
            clearInterval(timerStatus);

            // reset state
            ballotState = "not_init";

            // is this a quiz slide? -> find answers
            // this is the OLD version, which should be deprecated sometime
            var answers = Reveal.getCurrentSlide().getElementsByClassName('answer');
            if (answers.length)
            {
                // hide answers' right/wrong classification
                for (i = 0; i < answers.length; i++)
                {
                    answers[i].classList.remove('show-right');
                    answers[i].classList.remove('show-wrong');
                    answers[i].addEventListener('click', function() {
                        if (this.classList.contains("wrong")) this.classList.add("show-wrong");
                        if (this.classList.contains("right")) this.classList.add("show-right");
                    }, false);
                }

                // setup timer for showing #votes
                timerVotes  = setInterval(getVotes, 1000);
                timerStatus = setInterval(getStatus, 1000);
            }

            // is this a quiz slide? -> find answers (new version)
            answers = Reveal.getCurrentSlide().querySelectorAll('.reveal .quiz ul li');
            if (answers.length)
            {
                // hide answers' right/wrong classification
                for (var i = 0; i < answers.length; i++)
                {
                    answers[i].classList.remove('show-right');
                    answers[i].classList.remove('show-wrong');
                    answers[i].addEventListener('click', function() {
                        var correct = this.querySelector('input:checked');
                        this.classList.add( correct ? "show-right" : "show-wrong" );
                    }, false);
                }

                // setup timer for showing #votes
                timerVotes  = setInterval(getVotes, 1000);
                timerStatus = setInterval(getStatus, 1000);
            }
        }
    }



    // ballot stuff (needs authentication) -----------------------------------

    // start new ballot
    function startBallot()
    {
        var answers = Reveal.getCurrentSlide().getElementsByClassName('answer');
        var xhr = new XMLHttpRequest();
        xhr.open('post', server + '/init/' + answers.length, false);
        xhr.withCredentials = true;
        xhr.send(null);

        jingleQuestion.currentTime = 0;
        jingleQuestion.play();
    }

    // close ballot
    function closeBallot()
    {
        var xhr = new XMLHttpRequest();
        xhr.open('post', server + '/close', true);
        xhr.withCredentials = true;
        xhr.send(null);
    }



    // #votes stuff ----------------------------------------------------------

    // show votes div
    function showVotes()
    {
        votes_div.style.visibility = 'visible';
    }

    // hide votes div
    function hideVotes()
    {
        votes_div.style.visibility = 'hidden';
    }

    // get number of votes from server
    function getVotes()
    {
        var xhr = new XMLHttpRequest();
        xhr.open('get', server + '/count', true);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.addEventListener('load', function() { drawVotes(JSON.parse(xhr.response)); });
        xhr.send();
    }

    // draw number of votes
    function drawVotes(nVotes)
    {
        votes_div.innerHTML = nVotes;
    }


    // get status from server
    function getStatus()
    {
        var xhr = new XMLHttpRequest();
        xhr.open('get', server + '/status', true);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.addEventListener('load', function() { drawStatus(JSON.parse(xhr.response)); });
        xhr.send();
    }

    // draw number of votes
    function drawStatus(s)
    {
        serverState = s;
        if (s == "open")
        {
            votes_div.style.border = "3px solid green";
        }
        else
        {
            votes_div.style.border = "3px solid red";
        }
    }



    // chart stuff -----------------------------------------------------------

    // hide chart
    function hideChart()
    {
        chart_div.style.visibility = 'hidden';
    }


    // show/hide chart of answers
    function showChart()
    {
        // hide #votes
        votes_div.style.visibility = 'hidden';

        // setup new result request and add trigger drawChart
        var xhr = new XMLHttpRequest();
        xhr.open('get', server + '/result', true);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.addEventListener('load', function() { drawChart(JSON.parse(xhr.response)); });
        xhr.send();
    }


    // draw chart; result is JSON string of results
    function drawChart(result)
    {
        // play sound
        jingleAnswer.currentTime = 0;
        jingleAnswer.play();

        // resize and show
        var s = Reveal.getScale();
        var w = 400*s;
        var h = 300*s;
        chart_div.style.width  = w + "px";
        chart_div.style.height = h + "px";
        chart_div.style.visibility = 'visible';

        //console.log(result);
        //result = [10, 26, 5, 7];

        // we need google charts
        if (typeof(google) != 'undefined')
        {

            // how many answers?
            var n = 0;
		    for (var i = 0; i < result.length; i++)
            {
                n += result[i];
            }

            // convert answers to percentages
		    for (var i = 0; i < result.length; i++)
            {
                result[i] /= n;
            }

		    var data = new google.visualization.DataTable();
		    data.addColumn('string', 'Answer');
		    data.addColumn('number', 'Votes');
		    for (var i = 0; i < result.length; i++)
            {
			    data.addRow([ String.fromCharCode(i + 65), result[i] ]);
		    }

            var options = {
                'width':w,
                'height':h,
                legend: { position: "none" },
                bar: {groupWidth: "90%"},
                colors: [ '#2a9ddf' ],
                vAxis: { format: 'percent', viewWindow: { max:0.0, min:1.0 } },
                animation: { startup: true, duration: 2000, easing: 'out' },
            };

            var chart = new google.visualization.ColumnChart(chart_div);
            chart.draw(data, options);
        }
    }


    // ballot states
    function switchBallotState()
    {
        console.log("ballot state: " + ballotState);

        switch (ballotState)
        {
            case "not_init":
                startBallot();
                showVotes();
                ballotState = "open";
                break;

            case "open":
                if (serverState != "open")
                {
                    startBallot();
                }
                else
                {
                    closeBallot();
                    hideVotes();
                    showChart();
                    ballotState = "chart";
                }
                break;

            case "chart":
                hideChart();
                ballotState = "done";
                break;

            case "done":
                showChart();
                ballotState = "chart";
                break;

            default:
                console.log("should not happen");
                hideChart();
                hideVotes();
                ballotState = "not_init";
                break;
        }
    }



	return {
		init: function() { 
            return new Promise( function(resolve) {
                
                // setup keyboard shortcut
                Reveal.removeKeyBinding( 81 );
                Reveal.addKeyBinding( { keyCode: 81, key: 'Q', description: 'Toggle Quiz' }, switchBallotState );

                // add event listener
                Reveal.addEventListener( 'slidechanged', slideChanged );

                resolve();
            });
        }
    }

})();

Reveal.registerPlugin( 'quiz', RevealQuiz );

