
var isPlaying = false;

// number of steps
var stepsLength = 16;
var cIndex = 0;
var tempo = 120;
var maxTempo = 200;
var minTempo = 40;

// row sequences
var steps_0 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var steps_1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var steps_2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var sound_1;
var sound_2;
var sound_3;

var context;
var bufferLoader;

var time = 0;
var timeoutId;

var startOffset;
var lastDrawTime = -1;


$(document).ready(function() {

    $('.step-btn0').each(function(index) {
        // add click event listener
        $(this).on('click', function() {
            toggleBtnSelection(this);
        });
    });

    $('.step-btn1').each(function(index) {
        // add click event listener
        $(this).on('click', function() {
            toggleBtnSelection(this);
        });
    });
    $('.step-btn2').each(function(index) {
        // add click event listener
        $(this).on('click', function() {
            toggleBtnSelection(this);
        });
    });
    $('.step-btn3').each(function(index) {
        // add click event listener
        $(this).on('click', function() {
            toggleBtnSelection(this);
        });
    });


    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    bufferLoader = new BufferLoader(
            context,
            [
                'sounds/drums/kick_909_001.wav',
                'sounds/drums/sn_909_001.wav',
                'sounds/drums/hhc_909_005.wav',
            ],
            finishedLoading
            );

    bufferLoader.load();

    setTempo(tempo);
});

function finishedLoading(bufferList) {
    // Create 3 sources
    sound_1 = context.createBufferSource();
    sound_2 = context.createBufferSource();
    sound_3 = context.createBufferSource();

    sound_1.buffer = bufferList[0];
    sound_2.buffer = bufferList[1];
    sound_3.buffer = bufferList[2];

    sound_1.connect(context.destination);
    sound_2.connect(context.destination);
    sound_3.connect(context.destination);
}



function toggleBtnSelection(elem) {

    var active = $(elem).attr('class').indexOf('active') !== -1;
    var id = elem.id;
    var row = parseInt(id.split('-')[0]);
    var step = parseInt(id.split('-')[1]);

    if (active) {
        $(elem).removeClass('active-level' + row);
        active = false;
    }
    else {
        $(elem).addClass('active-level' + row);
        active = true;
    }

    

    if (row === 0) {
        if (active) {
            playSound(sound_1.buffer, 0);
            steps_0.splice(step, 1, 1);
        }
        else {
            steps_0.splice(step, 1, 0);
        }
    }
    else if (row === 1) {
        if (active) {
            playSound(sound_2.buffer, 0);
            steps_1.splice(step, 1, 1);
        }
        else {
            steps_1.splice(step, 1, 0);
        }
    }
    else if (row === 2) {
        if (active) {
            playSound(sound_3.buffer, 0);
            steps_2.splice(step, 1, 1);
        }
        else {
            steps_2.splice(step, 1, 0);
        }
    }

}


function playBeat() {

    var currentTime = context.currentTime;
    currentTime -= startOffset;

    while (time
< currentTime + 0.200) {
        // Convert noteTime to context time.
        var contextPlayTime = time + startOffset;

        // play first sound ?
        if (steps_0[cIndex] === 1) {
            playSound(sound_1.buffer, contextPlayTime);
        }

        // play second sound ?
        if (steps_1[cIndex] === 1) {
            playSound(sound_2.buffer, contextPlayTime);
        }

        // play third sound ?
        if (steps_2[cIndex] === 1) {
            // Pan the hihat according to sequence position.
            playSound(sound_3.buffer, contextPlayTime);
        }

        // drow follow line       
        if (time !== lastDrawTime) {
            lastDrawTime = time;
            follow((cIndex + 15) % 16);
        }

        moveForward();
    }

    timeoutId = setTimeout("playBeat()", 0);
}


function follow(index){
    
    var lastIndex = (index + 15) % 16;

    var elNew = $('#follow-' + index);
    var elOld = $('#follow-' + lastIndex);

    $(elNew).addClass('active-follow');
    $(elOld).removeClass('active-follow');
}


function playSound(buffer, time) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(time);
}

function moveForward() {
    // move forward by a 16th note...
    var BPS = 60.0 / tempo;
    cIndex++;
    if (cIndex === stepsLength) {
        cIndex = 0;
    }
    time += 0.25 * BPS;

}

function stop() {
    clearTimeout(timeoutId);     
}

(function() {
    var eventHandlers = {
        'play': function() {
            if (!isPlaying) {
                time = 0;
                startOffset = context.currentTime + 0.005;
                playBeat();
                isPlaying = true;
            }
            else {
                stop();
                isPlaying = false;
            }
        },
        'tempo-plus': function(sender) {
            if(tempo < maxTempo){
                tempo += 10;
                 setTempo(tempo);
            }
           
        },
        'tempo-minus': function(sender) {
            if(tempo > minTempo){
                tempo -= 10;
                setTempo(tempo);
            }            
        }
    };

    document.addEventListener('click', function(e) {
        var action = e.target.dataset && e.target.dataset.action;
        if (action && action in eventHandlers) {
            eventHandlers[action](e);
        }
    });
}());

function setTempo(value){
    tempo = value;
    $('#tempo').val( tempo );
}

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[index] = buffer;
                    if (++loader.loadCount == loader.urlList.length)
                        loader.onload(loader.bufferList);
                },
                function(error) {
                    console.error('decodeAudioData error', error);
                }
        );
    }

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
}