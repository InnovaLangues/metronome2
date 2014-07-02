<?php

// have to display errors if we want loadHTML to work...
ini_set('display_errors', 'On');
if ($_POST["word"]) {
    try {
        $url = 'http://dictionary.cambridge.org/dictionary/british/' . urlencode($_POST["word"]) . '?q=' . urlencode($_POST["word"]);
        $result = getPhonetic($url);
        if ($result != null) {
            echo $result;
            die;
        } else {
            // for some words, the url can be slightly different....
            $url = 'http://dictionary.cambridge.org/dictionary/british/' . urlencode($_POST["word"]) . '_1?q=' . urlencode($_POST["word"]);
            $result = getPhonetic($url);
            if ($result != null) {
                echo $result;
                die;
            }
        }
    }
    catch(Exception $e) {
        echo $e->getMessage();
        die;
    }
}
exit();

function getPhonetic($url) {
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($curl, CURLOPT_USERAGENT, 'testing wikipedia services');
    $result = curl_exec($curl);
    
    if ($result != '') {
        $dom = new DOMDocument();
        
        // get rid of warnings in result
        libxml_use_internal_errors(true);
        $dom->loadHTML($result);
        
        foreach ($dom->getElementsByTagName('span') as $span) {
            $classes = explode(' ', $span->getAttribute('class'));
            if (in_array('ipa', $classes)) {
                return $span->nodeValue;
                // get only the first matches since we only need the english phonetic
                break;
            }
        }
    } else {
        return null;
    }
}
