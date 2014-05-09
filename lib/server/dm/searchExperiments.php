<?php

require 'utils.php';

$baseURL = getBaseURL();

$search_string = $_GET['search_string'];
$exp_type_in = $_GET['exp_type'];
$IDs = array();
for ($i = 1; $i <= 6; $i++) { //check for type
    $url = $baseURL."retrieveExpByID.php?id=$i";
    $xml = file_get_contents($url);
    $xmlDoc = new DOMDocument();
    $xmlDoc->loadXML($xml);
    if ($exp_type_in == "Show All") {
        if ($search_string == "") {
            $exp_id = $xmlDoc->getElementsByTagName("id");
            $exp_id_str = $exp_id->item(0)->nodeValue;
            array_push($IDs, $exp_id_str);
        } else {//search term is present
            $content = $xmlDoc->saveXML();
            if (preg_match("/$search_string/i", $content)) {
                $exp_id = $xmlDoc->getElementsByTagName("id");
                $exp_id_str = $exp_id->item(0)->nodeValue;
                array_push($IDs, $exp_id_str);
            }
        }
    } else { //exp_type_in isn't "Show All"
        if ($search_string == "") {
            $exp_type = $xmlDoc->getElementsByTagName("type");
            $exp_type_str = $exp_type->item(0)->nodeValue;
            if (strcmp($exp_type_in, $exp_type_str) == 0) {
                $exp_id = $xmlDoc->getElementsByTagName("id");
                $exp_id_str = $exp_id->item(0)->nodeValue;
                array_push($IDs, $exp_id_str);
            }
        } else {//search term is present
            $content = $xmlDoc->saveXML();
            if (preg_match("/$search_string/i", $content)) {
                $exp_type = $xmlDoc->getElementsByTagName("type");
                $exp_type_str = $exp_type->item(0)->nodeValue;
                if (strcmp($exp_type_in, $exp_type_str) == 0) {
                    $exp_id = $xmlDoc->getElementsByTagName("id");
                    $exp_id_str = $exp_id->item(0)->nodeValue;
                    array_push($IDs, $exp_id_str);
                }
            }
        }
    }
}
$rtnjsonobj = $IDs;

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo json_encode($rtnjsonobj);
?>



