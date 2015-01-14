var isPlaying = false;
// number of steps
var stepsLength = 16;
var cIndex = 0;
var tempo = 140;
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
// DICTIONARY
var dictionary = Array(); // collection of dico entry
var editing = false; // editing row or not
var selectedIndex; // the index of the edited entry in the array
var currentEntryId; // the current edited entry id
var dicoTable; // jquery datatable
$(document).ready(function() {

    // fake dictionnary entries
    var entry = {};
    entry.id = 1;
    entry.entree = 'affect';
    entry.prononciation = 'ə ˈfekt';
    entry.theme = 'Action';
    entry.statut = 'V';
    entry.groupe = 'affect rapidly';
    entry.groupeP = 'ə ˈfekt ˈræp ɪd lɪ';
    entry.enonce = 'The factors that affect how rapidly a chemical reaction takes place.';
    dictionary.push(entry);
    entry = {};
    entry.id = 2;
    entry.entree = 'chemical';
    entry.prononciation = 'ˈkem ɪk əl';
    entry.theme = 'Chemistry';
    entry.statut = 'Adj';
    entry.groupe = 'chemical reaction';
    entry.groupeP = 'ˈkem ɪk əl ri ˈæk ʃən';
    entry.enonce = 'The factors that affect how rapidly a chemical reaction takes place.';
    dictionary.push(entry);
    
    // hide dico modal form
    $("#dico-form-container").toggle(1000);
    // happend entries data to dico entry list and init datatable
    applyDicoDatas(dictionary);
    // datatable select event
    $('#dico-list tbody').on('click', 'tr', function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            dicoTable.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });
    // datatable ROW DELETION event
    $('#dico-delete').click(function() {
        var selected = dicoTable.$('tr.selected');
        if (selected.get(0)) {
            dicoTable.fnDeleteRow(selected.get(0));
            currentEntryId = $(selected.get(0)).attr('id');
            selectedIndex = getDicoEntryIndexById(currentEntryId);
            if (selectedIndex != null) {
                dictionary.splice(selectedIndex, 1);
            } else {
                console.log('impossible de trouver l\'entrée sélectionnée');
            }
        } else alert('Veuillez sélectionner la ligne à supprimer');
    });
    // dico ROW EDITION event
    $('#dico-edit').click(function() {
        // UI
        var selected = dicoTable.$('tr.selected');
        if (selected.get(0)) {
            currentEntryId = $(selected.get(0)).attr('id');
            selectedIndex = getDicoEntryIndexById(currentEntryId);
            if (selectedIndex != null) {
                // splice collection array             
                var entry = dictionary[selectedIndex]; //dictionary.splice(selectedIndex, 1);
                setFormValues(entry);
                // show / hide form / dico table
                $("#dico-form-container").toggle(1000);
                $("#dico-list-container").toggle(1000);
                editing = true;
            } else {
                console.log('impossible de trouver l\'entrée sélectionnée');
            }
        } else {
            alert('Veuillez sélectionner la ligne à modifier');
        }
    });
    // apply selected item in beat box
    $('#dico').on('hidden.bs.modal', function() {
        var selected = dicoTable.$('tr.selected');
        if (selected.get(0)) {
            currentEntryId = $(selected.get(0)).attr('id');
            selectedIndex = getDicoEntryIndexById(currentEntryId);
            if (selectedIndex != null) {
                // get entry         
                var entry = dictionary[selectedIndex];
                // set inputs values
                $('#normal').val(entry.entree);
                $('#phonetic').val(entry.prononciation);
                // empty selected bar steps and symbol span
                emptyBarAndSymbols();
                $("#phonetics").html("");
            } else {
                console.log('impossible de trouver l\'entrée sélectionnée');
            }
        }
    });
    $('.step-btn0').each(function(index) {
        // add click event listener
        $(this).on('click', function() {
            toggleBtnSelection(this, true);
        });
    });
    $('.step-btn1').each(function(index) {
        // add click event listener
        $(this).on('click', function() {
            toggleBtnSelection(this, true);
        });
    });
    $('.step-btn2').each(function(index) {
        // add click event listener
        $(this).on('click', function() {
            toggleBtnSelection(this, true);
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
        getCambridgeInfo();
    });
    $(document).on("click", ".phonetic", function() {
        copyPhonetic(this);
    });
});
/*--------------------------------------------- DICTIONNARY ---------------------------------------------------*/
function applyDicoDatas(datas) {
    // in order to properly update datatable we need to destroy it an then reinitialise it
    if (dicoTable) {
        dicoTable.fnClearTable();
        dicoTable.fnDestroy();
    }
    for (var index in dictionary) {
        var entry = dictionary[index];
        var html = '';
        html += '<tr id="' + entry.id + '">';
        html += '   <td>' + entry.entree + '</td>';
        html += '   <td>' + entry.prononciation + '</td>';
        html += '   <td>' + entry.theme + '</td>';
        html += '   <td>' + entry.statut + '</td>';
        html += '   <td>' + entry.groupe + '</td>';
        html += '   <td>' + entry.groupeP + '</td>';
        html += '   <td>' + entry.enonce + '</td>';
        html += '</tr>';
        $('#dico-list tbody').append(html);
    }
    // init jquery data table
    dicoTable = $('#dico-list').dataTable({
        "aoColumnDefs": [
            //{ 'bSortable': false, 'aTargets': [ 0, 8 ] },
            //{ 'bVisible': false, 'aTargets': [ 0 ] },
            {
                'bSearchable': false,
                'aTargets': [6]
            }
        ],
        "oLanguage": {
            "oPaginate": {
                "sNext": "Suivant",
                "sPrevious": "Précédent"
            },
            "sEmptyTable": "Aucune entrée dans le dictionnaire",
            "sSearch": "Filtrer :",
            "sLengthMenu": "Afficher _MENU_ entrées",
            "sInfo": "Affichage des entrées _START_ à _END_ sur un total de _TOTAL_"
        }
    });
}

function getDicoEntryIndexById(id) {
    var index = null;
    for (var i = 0; i < dictionary.length; i++) {
        if (dictionary[i].id == id) {
            index = i;
            break;
        }
    }
    return index;
}

function setFormValues(entry) {
    $('#entree').val(entry.entree);
    $('#prononciation').val(entry.prononciation);
    $('#theme').val(entry.theme);
    $('#statut').val(entry.statut);
    $('#groupe').val(entry.groupe);
    $('#prononciation-groupe').val(entry.groupeP);
    $('#enonce').val(entry.enonce);
}

function generateEntryFakeId() {
    var last = dictionary[dictionary.length - 1].id;
    last++;
    return last;
}
/*--------------------------------------------- /DICTIONNARY ---------------------------------------------------*/
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

function toggleBtnSelection(elem, play) {
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
            if (play) playSound(sound_1.buffer, 0);
            steps_0.splice(step, 1, 1);
        } else {
            steps_0.splice(step, 1, 0);
        }
    } else if (row === 1) {
        if (active) {
            if (play) playSound(sound_2.buffer, 0);
            steps_1.splice(step, 1, 1);
        } else {
            steps_1.splice(step, 1, 0);
        }
    } else if (row === 2) {
        if (active) {
            if (play) playSound(sound_3.buffer, 0);
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
    if (5 >= precountPlayed) {
        playPcSound(precountSound.buffer, 0);
        precountPlayed++;
        $(".step-btn").addClass('active-precount');
        setTimeout(function() {
            $(".step-btn").removeClass('active-precount');
        }, 60);
    }
    if (6 <= precountPlayed) {
        clearTimeout(timeoutPrecountId);
        time = 0;
        startOffset = context.currentTime + 0.005;
        isPlaying = true;
        precountPlayed = 0;
        playBeat();
    }
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

function emptyBarAndSymbols() {
    // empty symbol text 
    $('span.symbol').html('');
    // empty bar
    $('.step-container div').each(function() {
        var classes = $(this).attr('class');
        if (classes.indexOf('active-level0') >= 0) {
            $(this).removeClass('active-level0');
        } else if (classes.indexOf('active-level1') >= 0) {
            $(this).removeClass('active-level1');
        } else if (classes.indexOf('active-level2') >= 0) {
            $(this).removeClass('active-level2');
        }
    });
}
// EVENTS
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
        },
        'add-word': function() {
            var entry = {};
            if (editing) { // editing                
                // create updated one
                entry.id = currentEntryId;
                entry.entree = $('#entree').val();
                entry.prononciation = $('#prononciation').val();
                entry.theme = $('#theme').val();
                entry.statut = $('#statut').val();
                entry.groupe = $('#groupe').val();
                entry.groupeP = $('#prononciation-groupe').val();
                entry.enonce = $('#enonce').val();
                //remove old one
                dictionary.splice(selectedIndex, 1);
                // add the updated entry at the good index
                dictionary.splice(selectedIndex, 0, entry);
                editing = false;
            } else { // new                
                entry.id = generateEntryFakeId();
                entry.entree = $('#entree').val();
                entry.prononciation = $('#prononciation').val();
                entry.theme = $('#theme').val();
                entry.statut = $('#statut').val();
                entry.groupe = $('#groupe').val();
                entry.groupeP = $('#prononciation-groupe').val();
                entry.enonce = $('#enonce').val();
                dictionary.push(entry);
            }
            // reinit inputs values
            $('#entree').val('');
            $('#prononciation').val('');
            $('#theme').val('');
            $('#statut').val('');
            $('#groupe').val('');
            $('#prononciation-groupe').val('');
            $('#enonce').val('');
            // reinit datatable
            applyDicoDatas(dictionary);
            // hide / show form / table
            $("#dico-form-container").toggle(1000);
            $("#dico-list-container").toggle(1000);
        },
        'show-doc-form': function() {
            // reinit inputs values
            $('#entree').val('');
            $('#prononciation').val('');
            $('#theme').val('');
            $('#statut').val('');
            $('#groupe').val('');
            $('#prononciation-groupe').val('');
            $('#enonce').val('');
            $("#dico-form-container").toggle(1000);
            $("#dico-list-container").toggle(1000);
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
        var strength = 2; // stress level ( 0 = stress 1 / 1 = stress 2 / 2 = stress 3 ) default = 2                
        // specific strength
        if (712 === syllabe.charCodeAt(0)) {
            strength = 0;
        } else if (716 === syllabe.charCodeAt(0)) {
            strength = 1;
        }
        /*
        eɪ  -> take -> teɪk     -> (101;618)
        aɪ  -> buy  -> baɪ      -> (97;618)
        ɔɪ  -> boy  -> bɔɪ      -> (596;618)
        ɪə  -> fear -> fɪər     -> (618;601)
        eə  -> care -> keər     -> (101;601)
        əʊ  -> go   -> ɡəʊ      -> (601;650)
        ʊə  -> pure -> pjʊər    -> (650;601)
        aʊ  -> cow  -> kaʊ      -> (97;650)
        */
        var diphtongs = Array();
        diphtongs[101] = [618, 601]; // e + ( ɪ | ə )
        diphtongs[97] = [618, 650]; // a + ( ɪ | ʊ )
        diphtongs[596] = [618]; // ɔ + ɪ
        diphtongs[618] = [601]; // ɪ + ə
        diphtongs[601] = [650]; // ə + ʊ
        diphtongs[650] = [601]; // ʊ + ə 
        // SYLLABE DURATION
        var duration = 'short'; // short / long default = 'short'
        // for each char in syllabe
        for (var j = 0; j < length; j++) {
            var unicode = syllabe.charCodeAt(j);
            // special char marking syllabe as a long one (ː)
            if (720 === unicode) {
                duration = 'long';
                break;
            }
            // other cases (we don't search for next char if this is the last one)
            else if (j < (length - 1) && diphtongs[unicode]) {
                // check if next char in the syllabe is in diphtongs possibly associated values
                var values = diphtongs[unicode];
                if (syllabe.charCodeAt(j + 1) && values.indexOf(syllabe.charCodeAt(j + 1)) != -1) {
                    duration = 'long';
                    break;
                }
            }
        }
        //////////// PATTERN /////////////
        // elem to select in pattern lines
        var elem = $('#' + strength + '-' + stepNumber); // id="0-0"
        toggleBtnSelection(elem[0], false);
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

function getCambridgeInfo() {
    var word = $("#normal").val();
    $("#phonetics").html("");
    $("#phonetic").val("");
    $("#phonetics-loading").show();
    $.ajax({
        type: 'POST',
        url: 'ajax/cambridge.php',
        dataType: 'text',
        data: {
            'word': word,
        },
        success: function(data) {
            if (data.length == 0) {
                $("#phonetics").html("rien trouvé");
            } else {
                $("#phonetics").append("<span data-phonetic='" + data + "' class='btn btn-sm btn-default phonetic'>" + data + "</span>");
            }
        },
        complete: function() {
            $("#phonetics-loading").hide();            
            emptyBarAndSymbols();
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
// surcharge de la méthode replaceAll pour une string
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