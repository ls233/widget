<?php

require 'utils.php';

$baseURL = getBaseURL();

$args = stripslashes($_GET['args']);
$decoded = json_decode($args);
#var_dump($decoded);
if (!empty($args)) {

#    $url = $baseURL . "retrieveExpByID.php?id=$expID";
//   
#    $xml = file_get_contents($url);
#    echo "$xml";


    $xmlDoc = new DOMDocument();
    $expID = $decoded->expID;
#    if (strcmp($expID, 'new') != 0) {
        $file_name = "data/exp" . $expID . ".xml";
        $xmlDoc->load($file_name);
//    echo getcwd();
//    echo $xmlDoc->saveXML();
//      $parent = $xmlDoc->getElementsByTagName('component')->item(0);
//grab a node
        $xpath = new DOMXPath($xmlDoc);
        $results = $xpath->query('/experiment/results');
        $parent = $results->item(0);
        $section = createElement($xmlDoc, 'section');
        $parent->appendChild($section);
        $tool = $decoded->tool;
        $tool = createElement($xmlDoc, 'tool', $tool);
        $section->appendChild($tool);        
        $notes = $decoded->notes;
        $notes = createElement($xmlDoc, 'notes', $notes);
        $section->appendChild($notes);
        $files = createElement($xmlDoc, 'files');
        $section->appendChild($files);
        $fileList = $decoded->files;
        $dirName = $decoded->dirName;
        foreach ($fileList as $attr => $val) {
#            echo $dirName . 'widget/fileUpload/example/files/' . $val;
            $file = createElement($xmlDoc, 'resultFile', $val, array('href' => $dirName . "widget/fileUpload/example/files/" . $val));
            $files->appendChild($file);
        }
//    echo $xmlDoc->saveXML();
        $xmlDoc->save($file_name);
 //   }
    $rtnjsonobj['status'] = 'ok';
    $rtnjsonobj['msg'] = 'record added to experiment ' . $expID;
} else {
    $rtnjsonobj['status'] = 'failed';
}
echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
#echo json_encode($rtnjsonobj);

function createElement($domObj, $tag_name, $value = NULL, $attributes = NULL) {
    $element = ($value != NULL ) ? $domObj->createElement($tag_name, $value) : $domObj->createElement($tag_name);

    if ($attributes != NULL) {
        foreach ($attributes as $attr => $val) {
            $element->setAttribute($attr, $val);
        }
    }

    return $element;
}
?>



