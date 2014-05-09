<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file converts plain table (with metadata) to html table
 */

$debug = 1; 

if($debug){
  //setup reporting problems to browsers
  try {
    require_once('browser_reporting.php');  
  } catch (Exception $e) {
    // report $e->getMessage()
  }
}

if (!empty($_GET['jsonString'])) {
    $params1 = $_GET["jsonString"];

$decoded = json_decode($params1);

$folder = $decoded->folder;

$pdataFileName = $decoded->file . "__pdata_cufDiff.txt";
$filePath = $folder . DIRECTORY_SEPARATOR . $pdataFileName;

$file = file($filePath);
$lines = count($file); //now count the lines ..

//start the table here..
    $table .= '<table cellpadding="0" id="stats" class="stats">';
    //$table .= '<table id="stats">';

//start the loop to get all lines in the table..
    for ($i = 0; $i < $lines; $i++) {
//get each line and exlplode it..
//    $part = preg_split('/\s+/', $file[$i]);
        $line = str_replace("\r","",$file[$i]);       
        $line = str_replace("\n","",$line);       
        $part = explode("\t", $line);
        if ($i == 0) {  //table header
            $table .='<thead>';
            $table .='<tr>';
            //$table .= '<th></th>';
            //$table .= '<th>ID</th>';
            $table .= '<th>+</th>';                        
            $table .= '<th>Group Name</th>';
            $table .= '<th>row.names</th>';
            for ($j = 0; $j < sizeof($part); $j++) {
                $rb= '<input type="checkbox" name="RadioButtonColHeader" value="' . $j . '" />';
                //$table .= '<td>' . $part[$j] . '</td>';
                $table .= '<th>' . $rb . $part[$j] . '</th>';
            }
            $table .= '</tr>';
            $table .='</thead>';
        } else { //table body
            if ($i == 1) {
                $table .='<tbody>';
            }
            $table .='<tr>';
            //$table .='<tr id=' . $i . '>';
            //$table .= '<td> <input type="checkbox" class="rowCheckbox" name="rawCheckbox" value="' . $j . '"/> </td>';
            //$table .= '<td>' . $i . '</td>';
            $table .= '<td></td>';
            //$table .= '<td><img class="center" src="/widget/lib/client/js/DataTables/examples/examples_support/details_open.png"></td>';
            $table .= '<td>TBD</td>';                        
            for ($j = 0; $j < sizeof($part); $j++) {
                $val = $part[$j]; 
                $table .= '<td>' . $val . '</td>';
            }
            $table .= '</tr>';
        }
    }
    $table .='</tbody>';

//close the table so HTML wont suffer :P
    $table .= '</table>';

    $arr = array('status' => 'ok', 'html' => $table);
} else {
    $arr = array('status' => 'failed');
}

$ret = json_encode($arr);
echo isset($_GET['callback']) ? "{$_GET['callback']}($ret)" : $ret;


?>
