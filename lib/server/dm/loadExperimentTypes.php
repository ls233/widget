<?php

$arr = array("Imaging Flow Cytometry" => "Imaging Flow Cytometry", "Flow Cytometry" => "Flow Cytometry", "Microarray" => "Microarray", "RT-qPCR" => "RT-qPCR", "Master" => "Master");
$tool2expType = array("Misty Mountain" => array("Flow Cytometry"), "flowPeaks" => array("Flow Cytometry"), "Tidal" => array("Microarray"), "clip" => array("Microarray"));


if (!empty($_GET['tool_title'])) {
    $tool_title = $_GET['tool_title'];
} 
else {
    echo $_GET['callback'] . '(' . json_encode($arr) . ')';
    exit(0);
}
 
$matched = array();
foreach ($tool2expType as $key => $val) {
    if (preg_match("/$key/i", $tool_title)) {
        $arr = $val;
    } 
}

echo $_GET['callback'] . '(' . json_encode($arr) . ')';
?>



