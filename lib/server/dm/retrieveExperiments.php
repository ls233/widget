<?php
require 'utils.php';

$search_string = $_GET['search_string'];
$exp_type = $_GET['exp_type'];

$baseURL = getBaseURL();
$url = $baseURL."searchExperiments.php?exp_type=".urlencode($exp_type)."&search_string=".urlencode($search_string);
#var_dump($url);
$exp_IDs_json = file_get_contents($url);
#var_dump($exp_IDs_json);
$exp_IDs = json_decode($exp_IDs_json);
$IDs = array();
if (!empty($exp_IDs)) {
    $rtnjsonobj['status'] = 'ok';        
    foreach ($exp_IDs as &$i) {
        $url = $baseURL."retrieveExpByID.php?id=$i";
        $exp_xml = file_get_contents($url);
        $xhtml = xslt($exp_xml);
        array_push($IDs, $xhtml);
    }
    $rtnjsonobj['results'] = $IDs;    
}
else{
    $rtnjsonobj['status'] = 'failure';            
    $rtnjsonobj['msg'] = 'Experiments not found';                
}
  


// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';

function xslt($xml) {

    $xmlDoc = new DOMDocument();
    $xmlDoc->loadXML($xml);

    $xslDoc = new DOMDocument();
    $xslDoc->load("widget/css/xml2xhtml.xsl");

    $proc = new XSLTProcessor();
    $proc->importStylesheet($xslDoc);
    return $proc->transformToXML($xmlDoc);
}
?>



