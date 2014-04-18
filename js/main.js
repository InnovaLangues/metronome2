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
// PRECOUNT
var precountSound;
var timeoutPrecountId;
var precountPlayed = 1;
var pcContext;
var pcBufferLoader;
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
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    bufferLoader = new BufferLoader(context, ['sounds/drums/kick_909_001.wav', 'sounds/drums/sn_909_001.wav', 'sounds/drums/hhc_909_005.wav'], finishedLoading);
    bufferLoader.load();
    pcContext = new AudioContext();
    pcBufferLoader = new BufferLoader(pcContext, ['sounds/woodblock.wav'], finishedPcLoading);
    pcBufferLoader.load();
    setTempo(tempo);
    $("#wiktionary").on('click', function() {
        getWiktionaryInfo();
    });
    $(document).on("click", ".phonetic", function() {
        copyPhonetic(this);
    });
});

function finishedPcLoading(bufferList) {
    precountSound = pcContext.createBufferSource();
    precountSound.buffer = bufferList[0];
    precountSound.connect(pcContext.destination);
}

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
    } else {
        $(elem).addClass('active-level' + row);
        active = true;
    }
    if (row === 0) {
        if (active) {
            playSound(sound_1.buffer, 0);
            steps_0.splice(step, 1, 1);
        } else {
            steps_0.splice(step, 1, 0);
        }
    } else if (row === 1) {
        if (active) {
            playSound(sound_2.buffer, 0);
            steps_1.splice(step, 1, 1);
        } else {
            steps_1.splice(step, 1, 0);
        }
    } else if (row === 2) {
        if (active) {
            playSound(sound_3.buffer, 0);
            steps_2.splice(step, 1, 1);
        } else {
            steps_2.splice(step, 1, 0);
        }
    }
}

function playBeat() {
    var currentTime = context.currentTime;
    currentTime -= startOffset;
    while (time < currentTime + 0.200) {
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

function playPrecount() {
    timeoutPrecountId = setTimeout("playPrecount()", (60000 / tempo));
    playPcSound(precountSound.buffer, 0);
    if (2 >= precountPlayed) {
        playPcSound(precountSound.buffer, 0);
        $(".step-btn").addClass('active-precount');
        setTimeout(function() {
            $(".step-btn").removeClass('active-precount');
        }, 60);
    }
    if (3 === precountPlayed) {
        //console.log(precountPlayed);
        clearTimeout(timeoutPrecountId);
        time = 0;
        startOffset = context.currentTime + 0.005;
        playBeat();
        isPlaying = true;
        precountPlayed = 0;
    }
    precountPlayed++;
    //
}

function follow(index) {
    var lastIndex = (index + 15) % 16;
    var elNew = $('#follow-' + index);
    var elOld = $('#follow-' + lastIndex);
    $(elNew).addClass('active-follow');
    $(elOld).removeClass('active-follow');
}

function playPcSound(buffer, time) {
    var source = pcContext.createBufferSource();
    source.buffer = buffer;
    source.connect(pcContext.destination);
    source.start(time);
}

function playSound(buffer, time) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(time);
}

function moveForward() {
    // move forward by a 16th note...
    var BPS = 120.0 / tempo;
    cIndex++;
    if (cIndex === stepsLength) {
        cIndex = 0;
    }
    time += 0.25 * BPS;
}

function stop() {
    clearTimeout(timeoutId);
    clearTimeout(timeoutPrecountId);
}
(function() {
    var eventHandlers = {
        'play': function() {
            if (!isPlaying) {
                // play precount before playing beat
                playPrecount();
            } else {
                stop();
                isPlaying = false;
            }
        },
        'tempo-plus': function(sender) {
            if (tempo < maxTempo) {
                tempo += 10;
                setTempo(tempo);
            }
        },
        'tempo-minus': function(sender) {
            if (tempo > minTempo) {
                tempo -= 10;
                setTempo(tempo);
            }
        },
        'to-sequencer': function() {
            var phonetic = $('#phonetic').val();
            setRythmAndSymbolsText(phonetic);
        }
    };
    document.addEventListener('click', function(e) {
        var action = e.target.dataset && e.target.dataset.action;
        if (action && action in eventHandlers) {
            eventHandlers[action](e);
        }
    });
}());

function setTempo(value) {
    tempo = value;
    $('#tempo').text(tempo);
}

function setRythmAndSymbolsText(value) {
    // split text value by spaces
    var syllabes = value.split(' ');
    $('span.symbol').html('');
    // unselect all previously selected steps
    resetSteps();
    var stepNumber = 0;
    for (var i = 0; i < syllabes.length; i++) {
        var syllabe = syllabes[i];
        var length = syllabe.length;
        // SYLLABE STRENGTH
        var strength = 2; // stress level ( 0 = stress 3 / 1 = stress 2 / 2 = stress 1 ) default = 2                
        // specific strength
        if (712 === syllabe.charCodeAt(0)) {
            strength = 0;
        } else if (716 === syllabe.charCodeAt(0)) {
            strength = 1;
        }
        // SYLLABE DURATION
        var duration = 'short'; // short / long default = 'short'
        // for each char in syllabe
        for (var j = 0; j < length; j++) {
            var unicode = syllabe.charCodeAt(j);
            // TODO : other cases that make a syllabe a long one
            if (720 === unicode) {
                duration = 'long';
                break;
            }
        }
        //////////// PATTERN /////////////
        // elem to select in pattern lines
        var elem = $('#' + strength + '-' + stepNumber); // id="0-0"
        toggleBtnSelection(elem[0]);
        // next column index
        if ('long' === duration) stepNumber = i + 2;
        else stepNumber++;
        //////////// SYMBOL TEXT /////////////
        // write symbol
        var symbol = $('span.symbol').html();
        if (length > 2) {
            var spaces = Math.floor(length / 2);
            // is this the first syllabe ?
            if (0 === i) {
                for (var k = 0; k < spaces; k++) {
                    symbol += '&nbsp;';
                }
            }
            if (2 === strength) symbol += 'o';
            else if (1 === strength) symbol += '0';
            else if (0 === strength) symbol += '§';
            // add spaces after
            for (var k = 0; k < spaces; k++) {
                symbol += '&nbsp;&nbsp;';
            }
        } else {
            if (0 === i) {
                symbol += '&nbsp;';
            }
            if (2 === strength) symbol += 'o&nbsp;&nbsp;&nbsp;&nbsp;';
            else if (1 === strength) symbol += '0&nbsp;&nbsp;&nbsp;&nbsp;';
            else if (0 === strength) symbol += '§&nbsp;&nbsp;&nbsp;&nbsp;';
        }
        $('span.symbol').html(symbol);
    }
}

function resetSteps() {
    $('.step-btn0').each(function(index) {
        var active = $(this).attr('class').indexOf('active') !== -1;
        if (active) {
            $(this).removeClass('active-level0');
        }
    });
    $('.step-btn1').each(function(index) {
        var active = $(this).attr('class').indexOf('active') !== -1;
        if (active) {
            $(this).removeClass('active-level1');
        }
    });
    $('.step-btn2').each(function(index) {
        var active = $(this).attr('class').indexOf('active') !== -1;
        if (active) {
            $(this).removeClass('active-level2');
        }
    });
    steps_0 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    steps_1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    steps_2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

function getWiktionaryInfo() {
    var word = $("#normal").val();
    $("#phonetics").html("");
    $("#phonetic").val("");
    $("#phonetics-loading").show();
    $.ajax({
        type: 'POST',
        // make sure you respect the same origin policy with this url:
        // http://en.wikipedia.org/wiki/Same_origin_policy
        url: 'ajax/wiktionary.php',
        dataType: 'json',
        data: {
            'word': word,
        },
        success: function(data) {
            if (data.length == 0) {
                $("#phonetics").html("rien trouvé");
            } else {
                for (var i = 0; i < data.length; i++) {
                    $("#phonetics").append("<span data-phonetic='" + data[i] + "' class='btn btn-sm btn-default phonetic'>" + data[i] + "</span>");
                };
            }
        },
        complete: function() {
            $("#phonetics-loading").hide();
        }
    });
}

function copyPhonetic(phonetic) {
    var value = '';
    for (var i = 0; i < phonetic.innerHTML.length; i++) {
        if (i > 0 && (phonetic.innerHTML.charCodeAt(i) === 712 || phonetic.innerHTML.charCodeAt(i) === 716)) {
            value += ' ';
        }
        value += phonetic.innerHTML.charAt(i);
    }
    value = value.replaceAll('.', ' ');
    $("#phonetic").val(value);
}
String.prototype.replaceAll = function(find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};
//////////////////////////////////////////////  BUFFER LOADER  //////////////////////////////////////////////////////////////////////
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
        loader.context.decodeAudioData(request.response, function(buffer) {
            if (!buffer) {
                alert('error decoding file data: ' + url);
                return;
            }
            loader.bufferList[index] = buffer;
            if (++loader.loadCount == loader.urlList.length) loader.onload(loader.bufferList);
        }, function(error) {
            console.error('decodeAudioData error', error);
        });
    }
    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }
    request.send();
}
BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i) this.loadBuffer(this.urlList[i], i);
}