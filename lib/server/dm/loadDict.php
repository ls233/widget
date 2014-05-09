<?php

//$arr = array("Imaging Flow Cytometry" => "Imaging Flow Cytometry", "Flow Cytometry" => "Flow Cytometry", "Microarray" => "Microarray", "RT-qPCR" => "RT-qPCR", "Master" => "Master");
$tool2expType = array("Misty Mountain" => "Flow Cytometry", "flowPeaks" => "Flow Cytometry", "Tidal" => "Gene Microarray", "clip" => "Gene Microarray");
//$tool2expType = array("Misty Mountain" => array("Flow Cytometry"), "flowPeaks" => array("Flow Cytometry"), "Tidal" => array("Gene Microarray"), "clip" => array("Gene Microarray"));

$json = json_encode($tool2expType);
echo isset($_GET['callback']) ? "{$_GET['callback']}($json)" : $json;
?>



