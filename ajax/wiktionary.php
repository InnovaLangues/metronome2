<?php
header ("content-type: application/json; charset=utf-8");

if ($_POST["word"]) {
    $url = 'http://en.wiktionary.org/w/api.php?page='.urlencode($_POST["word"]).'&action=parse&prop=wikitext';
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($curl, CURLOPT_USERAGENT, 'testing wikipedia services');
    $result = curl_exec($curl);

    preg_match_all("/{{IPA\|\/(.*?)\/}}$/m", $result, $matches);

    echo json_encode($matches[1]);
}
exit();