<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file runs R script that generates MA data heatmap
 */

$debug = 1; 

$ret = array('status' => 'failed'); //change on success later

if($debug){
  //setup reporting problems to browsers
  try {
    require_once('browser_reporting.php');  
  } 
  catch (Exception $e) {
    $ret['msg'] = $e->getMessage();
    die(isset($_GET['callback']) ? "{$_GET['callback']}($ret)" : $ret);
  }
}

function getPathToR() { 
    $file = "../../../widget_conf.json"; //conf file
    $json = json_decode(file_get_contents($file),true);
    $system_settings = $json['system_settings'];
    $pathToR = $system_settings['R'];
    return $pathToR;
}

if (!empty($_GET['jsonString'])) {
    $params1 = $_GET["jsonString"];
}

$myFile = "inSilicoDB" . DIRECTORY_SEPARATOR . "heatmapSettings.txt";
try {
  $fh1 = fopen($myFile, 'w');
  fwrite($fh1, $params1);
} catch (Exception $e) {
  $ret['msg'] = $e->getMessage();
  if($debug){ $firephp->log($e->getMessage());}
  die(isset($_GET['callback']) ? "{$_GET['callback']}($ret)" : $ret);
}

//fwrite($fh, "$params1\n");
$params1 = preg_replace('/"/', '\"', $params1);

//$stringData = "Bobby Bopper\n";
//fwrite($fh, "$params1\n");

//$pathToR = '"c:\Program Files\R\R-3.0.1\bin\x64\R"';
$pathToR = getPathToR();


$pathToRScript = "inSilicoDB" . DIRECTORY_SEPARATOR . "makeHeatmap.R";

$cmd = "$pathToR  --vanilla --quiet --slave --args \"$params1\"  <  $pathToRScript" ;
//fwrite($fh, $cmd);

$ret = exec($cmd, $out = array(), $status);
/*
$firephp->log($ret, 'ret');
$firephp->log($out, 'out');
$firephp->log($status, 'status');
$firephp->log($cmd, 'cmd');
*/
if ($status != 0) {
    // Command execution failed
    $ret = array('status' => 'failed');
} else {
    // Command executed OK.
//    echo "OK!";
    $folder = substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], "/") + 1);
    $host = $_SERVER['HTTP_HOST'];
    $baseURL = "http://" . $host . $folder;
    $decodedRet = json_decode($ret);
    $updatedRet = array('ret' => $decodedRet, 'baseURL' => $baseURL);
     $ret = json_encode($updatedRet);    
//    var_dump($updatedRet);
//    $decoded = json_decode($ret);
//    var_dump($decoded);
//    $info = $decoded->info;
//    $info->new = 'baseURL';
//    $info->baseURL = '1234';
//    $decoded->info = $info;
//    var_dump($decoded);
//    $ret = json_encode($decoded);
}



echo isset($_GET['callback']) ? "{$_GET['callback']}($ret)" : $ret;
?>
